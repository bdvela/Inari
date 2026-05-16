"""
Endpoints del asistente conversacional de cotización.

Flujo: start → message* → confirm
El confirm ejecuta el mismo pipeline que generate_quotation pero desde
los parámetros acumulados por el asistente.

Fronteras respetadas: no importa de otros routers; reutiliza módulos.
"""
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.api.dependencies.auth import get_current_user
from backend.core.database import get_db
from backend.core.logging import get_logger
from backend.models.chat_session import ChatSession
from backend.models.models import (
    BasePackage,
    BusinessRule,
    Event,
    EventType,
    OptimizationLog,
    Quotation,
    QuotationChangeLog,
    QuotationDetail,
    QuotationLevel,
    QuotationStatus,
    User,
)
from backend.models.repositories import ProviderRepository, QuotationRepository
from backend.modules.assistant.chat_orchestrator import (
    confirm_session,
    process_message,
    start_session,
)
from backend.modules.optimizer.schemas import OptimizationInput, ProviderOption
from backend.modules.packages.exceptions import NoPackagesConfiguredError
from backend.modules.packages.schemas import ServicePackage as ServicePackageSvc
from backend.modules.packages.selector import select_package
from backend.modules.proposal_gen.generator import generate_proposals
from backend.modules.rules_engine.engine import evaluate_rules
from backend.modules.rules_engine.schemas import RuleDefinition, RuleEvaluationInput

logger = get_logger("api.chat")
router = APIRouter(prefix="/chat", tags=["Asistente"])

_SESSION_TTL_HOURS = 24

# ─── Request / Response schemas ──────────────────────────────────────────────

class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ConfirmRequest(BaseModel):
    params: dict[str, Any] | None = None


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _load_session(session_id: str, db: AsyncSession) -> ChatSession:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return session


def _check_ownership(session: ChatSession, user: User) -> None:
    if session.user_id != user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta sesión")


def _check_not_expired(session: ChatSession) -> None:
    created = session.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - created
    if age.total_seconds() > _SESSION_TTL_HOURS * 3600:
        raise HTTPException(status_code=410, detail="Sesión expirada")


def _parse_event_date(raw: str) -> date:
    """ISO date first; then year+month extraction; fallback 90 días."""
    # ISO YYYY-MM-DD
    try:
        return date.fromisoformat(raw)
    except (ValueError, TypeError):
        pass

    raw_lower = str(raw).lower()

    # Extraer año
    year_match = re.search(r"\b(202[5-9]|203\d)\b", raw_lower)

    # Meses en español
    month_map = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
        "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
        "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
    }

    if year_match:
        year = int(year_match.group(1))
        for name, num in month_map.items():
            if name in raw_lower:
                return date(year, num, 15)
        return date(year, 6, 15)

    return date.today() + timedelta(days=90)


async def _log_change(
    db: AsyncSession,
    quotation_id: int,
    user: User,
    accion: str,
) -> None:
    db.add(QuotationChangeLog(
        cotizacion_id=quotation_id,
        usuario_nombre=user.nombre or "chat",
        usuario_rol=user.role.value,
        accion=accion,
        created_at=datetime.now(timezone.utc),
    ))


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/start", status_code=201)
async def chat_start(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await start_session(current_user.id, db)
    return {
        "session_id": session.id,
        "assistant_message": session.messages[0]["content"],
    }


@router.post("/{session_id}/message")
async def chat_message(
    session_id: str,
    body: MessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await _load_session(session_id, db)
    _check_ownership(session, current_user)
    _check_not_expired(session)

    try:
        result = await process_message(session_id, body.message, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Error en asistente conversacional: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Asistente temporalmente no disponible",
        )

    return result


@router.post("/{session_id}/confirm", status_code=201)
async def chat_confirm(
    session_id: str,
    body: ConfirmRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── Validaciones de sesión ────────────────────────────────────────────
    session = await _load_session(session_id, db)
    _check_ownership(session, current_user)
    _check_not_expired(session)

    try:
        session = await confirm_session(session_id, db, body.params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # ── Extraer parámetros confirmados ────────────────────────────────────
    params = session.extracted_params
    evento_tipo: str = str(params["tipo_evento"])
    num_invitados: int = int(params["num_invitados"])
    presupuesto_maximo: float = float(params["presupuesto"])
    event_date: date = _parse_event_date(str(params["fecha"]))
    estilo_raw: list = params.get("style_hints", [])
    estilo: str | None = ", ".join(estilo_raw) if estilo_raw else None

    try:
        event_type_enum = EventType(evento_tipo)
    except ValueError:
        event_type_enum = EventType.OTRO

    # ── 1. Crear evento ───────────────────────────────────────────────────
    event = Event(
        cliente_id=current_user.id,
        tipo=event_type_enum,
        fecha=event_date,
        num_invitados=num_invitados,
        presupuesto_maximo=presupuesto_maximo,
        estilo=estilo,
    )
    db.add(event)
    await db.flush()

    # ── 2. Motor de reglas ────────────────────────────────────────────────
    db_rules_result = await db.execute(
        select(BusinessRule)
        .where(BusinessRule.tipo_evento == event_type_enum)
        .options(selectinload(BusinessRule.servicio))
    )
    db_rules = list(db_rules_result.scalars().all())
    rule_definitions = [
        RuleDefinition(
            service_id=str(r.servicio_id),
            service_name=r.servicio.nombre if r.servicio else str(r.servicio_id),
            es_obligatorio=r.es_obligatorio,
            condicion=r.condicion,
        )
        for r in db_rules
    ]
    rule_result = evaluate_rules(
        RuleEvaluationInput(
            event_type=evento_tipo,
            num_invitados=num_invitados,
            rules=rule_definitions,
        )
    )

    # ── 3. Catálogo de proveedores ────────────────────────────────────────
    provider_repo = ProviderRepository(db)
    db_providers = await provider_repo.get_available_for_event(event_type_enum, event_date)
    provider_options = [
        ProviderOption(
            id=p.id,
            service_id=p.servicio_id,
            service_name=p.servicio.nombre if p.servicio else str(p.servicio_id),
            nombre=p.nombre,
            costo=p.costo_base,
            quality_index=p.indice_calidad,
            tipos_evento_compatibles=p.tipos_evento_compatibles,
            fechas_no_disponibles=p.fechas_no_disponibles,
        )
        for p in db_providers
    ]

    # ── 4. Paquete base ───────────────────────────────────────────────────
    package_cost = 0.0
    selected_pkg_info = None
    db_pkgs_result = await db.execute(
        select(BasePackage).where(BasePackage.is_active == True)  # noqa: E712
    )
    db_pkgs = list(db_pkgs_result.scalars().all())
    if db_pkgs:
        pkg_list = [
            ServicePackageSvc(
                id=p.id, name=p.name, content=p.content,
                cost=p.cost, min_guests=p.min_guests, max_guests=p.max_guests,
            )
            for p in db_pkgs
        ]
        try:
            pkg_result = select_package(num_invitados, pkg_list)
            if pkg_result.selected_package:
                package_cost = pkg_result.selected_package.cost
                selected_pkg_info = {
                    "id": pkg_result.selected_package.id,
                    "name": pkg_result.selected_package.name,
                    "cost": pkg_result.selected_package.cost,
                }
        except NoPackagesConfiguredError:
            pass

    available_budget = max(0.0, presupuesto_maximo - package_cost)

    # ── 5. Crear cotizaciones ─────────────────────────────────────────────
    quot_repo = QuotationRepository(db)
    version = await quot_repo.get_next_version(event.id)

    q_basica = Quotation(
        cliente_id=current_user.id,
        evento_id=event.id,
        version=version,
        nivel=QuotationLevel.BASICO,
        estado=QuotationStatus.PROCESANDO,
        parametros_json={
            "event_type": evento_tipo,
            "num_invitados": num_invitados,
            "budget": presupuesto_maximo,
            "package_selected": selected_pkg_info,
            "image_inferred_services": [],
            "origen": "chat",
        },
    )
    q_premium = Quotation(
        cliente_id=current_user.id,
        evento_id=event.id,
        version=version,
        nivel=QuotationLevel.PREMIUM,
        estado=QuotationStatus.PROCESANDO,
        parametros_json={
            "event_type": evento_tipo,
            "num_invitados": num_invitados,
            "budget": presupuesto_maximo * 1.3,
            "package_selected": selected_pkg_info,
            "image_inferred_services": [],
            "origen": "chat",
        },
    )
    db.add(q_basica)
    db.add(q_premium)
    await db.flush()

    # ── 6. Optimizar ──────────────────────────────────────────────────────
    opt_input = OptimizationInput(
        budget=available_budget,
        required_services=rule_result.required_services,
        optional_services=rule_result.optional_services,
        event_type=evento_tipo,
        event_date=event_date,
        providers=provider_options,
    )

    basica, premium, res_basica, res_premium = generate_proposals(
        base_input=opt_input,
        quotation_id_base=q_basica.id,
        quotation_id_premium=q_premium.id,
        evento_tipo=evento_tipo,
        evento_fecha=event_date,
        num_invitados=num_invitados,
        estilo=estilo,
        cliente_nombre=current_user.nombre or "Cliente",
        version=version,
    )

    # ── 7. Persistir detalles y logs ──────────────────────────────────────
    now = datetime.now(timezone.utc)
    for quotation, result in [(q_basica, res_basica), (q_premium, res_premium)]:
        if result.feasible:
            for sp in result.selected_providers:
                db.add(QuotationDetail(
                    cotizacion_id=quotation.id,
                    proveedor_id=sp.provider_id,
                    costo_negociado=sp.costo,
                    es_obligatorio=sp.es_obligatorio,
                    nombre_servicio=sp.service_name,
                ))
            quotation.estado = QuotationStatus.COMPLETADO
            quotation.costo_total = result.total_cost + package_cost
            quotation.quality_score = result.quality_score
        else:
            quotation.estado = QuotationStatus.ERROR

        db.add(OptimizationLog(
            cotizacion_id=quotation.id,
            input_json=opt_input.model_dump(mode="json"),
            output_json=result.model_dump(mode="json"),
            algoritmo_usado=result.algorithm_used,
            duracion_ms=result.execution_ms,
            es_factible=result.feasible,
            created_at=now,
        ))

    await _log_change(db, q_basica.id, current_user, "cotizacion_creada_chat")
    await _log_change(db, q_premium.id, current_user, "cotizacion_creada_chat")
    await db.flush()

    return {
        "evento_id": event.id,
        "quotation_id": q_basica.id,
        "quotation_premium_id": q_premium.id,
        "redirect_to": f"/quotations/{q_basica.id}",
    }
