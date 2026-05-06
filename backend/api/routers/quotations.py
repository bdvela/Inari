"""
Endpoints de cotizaciones.
Los endpoints orquestan — no tienen lógica de negocio.
Toda la lógica está en los módulos correspondientes.
"""
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from backend.api.dependencies.auth import get_current_user, require_role
from backend.core.database import get_db
from backend.core.logging import get_logger
from backend.models.models import (
    BasePackage,
    Event,
    EventType,
    OptimizationLog,
    Provider,
    Quotation,
    QuotationDetail,
    QuotationLevel,
    QuotationStatus,
    ReferenceImage,
    User,
    UserRole,
)
from backend.models.repositories import ProviderRepository, QuotationRepository
from backend.modules.optimizer.schemas import OptimizationInput, ProviderOption
from backend.modules.pdf_gen.generator import generate_pdf
from backend.modules.proposal_gen.generator import generate_proposals
from backend.modules.rules_engine.engine import evaluate_rules
from backend.modules.rules_engine.schemas import RuleEvaluationInput
from backend.modules.storage import StorageError, get_storage
from backend.modules.visual_analysis.client import analyze_image
from backend.modules.visual_analysis.exceptions import VisualAnalysisError
from backend.modules.visual_analysis.text_parser import parse_description
from backend.modules.visual_analysis.style_analysis import analyze_style_references
from backend.modules.visual_analysis.schemas import ParsedDescription
from backend.modules.packages.selector import select_package
from backend.modules.packages.schemas import ServicePackage as ServicePackageSvc
from backend.modules.packages.exceptions import NoPackagesConfiguredError

logger = get_logger("api.quotations")
router = APIRouter(prefix="/quotations", tags=["Cotizaciones"])


def _luxury_to_quality_weight(luxury_level: int) -> float:
    """Convierte luxury_level (1-5) a quality_weight para el optimizer."""
    mapping = {1: 0.70, 2: 0.85, 3: 1.00, 4: 1.30, 5: 1.60}
    return mapping.get(max(1, min(5, luxury_level)), 1.00)


class ParseDescriptionRequest(BaseModel):
    description: str


class QuotationCreateRequest(BaseModel):
    evento_tipo: EventType
    evento_fecha: str          # "YYYY-MM-DD"
    num_invitados: int
    presupuesto_maximo: float
    estilo: str | None = None
    descripcion: str | None = None


class QuotationSummary(BaseModel):
    id: int
    nivel: str
    estado: str
    costo_total: float | None
    quality_score: float | None
    version: int
    created_at: datetime


@router.post("/parse-description", response_model=ParsedDescription)
async def parse_event_description(
    body: ParseDescriptionRequest,
    _: User = Depends(get_current_user),
):
    """
    Extrae parámetros de evento desde descripción libre del cliente.
    Usa Gemini para interpretar lenguaje natural. Nunca lanza excepción — siempre retorna JSON.
    """
    return await parse_description(body.description)


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_quotation(
    evento_tipo: str = Form(...),
    evento_fecha: str = Form(...),
    num_invitados: int = Form(...),
    presupuesto_maximo: float = Form(...),
    estilo: str | None = Form(None),
    descripcion: str | None = Form(None),
    image: UploadFile | None = File(None),
    style_images: list[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    CU-01: Generar cotización desde imagen referencial.
    Flujo: imagen → análisis visual → wizard params → rules → optimizer → propuesta → PDF
    """
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="El rol Admin es de configuración del sistema y no puede generar cotizaciones.",
        )

    from datetime import date as date_type
    event_date = date_type.fromisoformat(evento_fecha)

    # Análisis de imágenes de estilo (si se enviaron) — determina quality_weight
    style_result = None
    quality_weight = 1.0
    if style_images:
        valid_images = [
            (await img.read(), img.filename or "ref.jpg")
            for img in style_images
            if img.filename
        ]
        if valid_images:
            style_result = await analyze_style_references(valid_images)
            if style_result and style_result.confidence > 0.3:
                quality_weight = _luxury_to_quality_weight(style_result.luxury_level)
                logger.info(
                    "Estilo detectado: %s (luxury_level=%d, quality_weight=%.2f)",
                    style_result.aesthetic_style, style_result.luxury_level, quality_weight,
                )

    # 1. Crear evento
    event = Event(
        cliente_id=current_user.id,
        tipo=EventType(evento_tipo),
        fecha=event_date,
        num_invitados=num_invitados,
        presupuesto_maximo=presupuesto_maximo,
        estilo=estilo,
        descripcion=descripcion,
    )
    db.add(event)
    await db.flush()

    # 2. Storage + análisis visual (si hay imagen)
    visual_result = None
    if image and image.filename:
        image_bytes = await image.read()
        storage = get_storage()

        # Guardar imagen en storage (local dev o cloud prod)
        try:
            storage_key, public_url = await storage.save(image_bytes, image.filename)
        except StorageError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        ref_image = ReferenceImage(
            evento_id=event.id,
            url_storage=public_url,
            nombre_archivo=image.filename,
        )
        db.add(ref_image)
        await db.flush()

        # Análisis visual — flujo alternativo si falla (CU-01 3a)
        try:
            visual_result = await analyze_image(image_bytes, image.filename)
            ref_image.resultado_analisis = visual_result.model_dump()
            ref_image.analisis_exitoso = True
            logger.info("Análisis visual exitoso para evento %d", event.id)
        except VisualAnalysisError as exc:
            logger.warning("Análisis visual falló, continuando sin él: %s", exc)

    # 3. Motor de reglas — cargar desde BD
    from backend.models.models import BusinessRule
    from backend.modules.rules_engine.schemas import RuleDefinition

    db_rules_result = await db.execute(
        select(BusinessRule)
        .where(BusinessRule.tipo_evento == EventType(evento_tipo))
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

    rule_inp = RuleEvaluationInput(
        event_type=evento_tipo,
        num_invitados=num_invitados,
        rules=rule_definitions,
    )
    rule_result = evaluate_rules(rule_inp)

    # 4. Preparar catálogo de proveedores
    provider_repo = ProviderRepository(db)
    db_providers = await provider_repo.get_available_for_event(EventType(evento_tipo), event_date)

    if not db_providers:
        raise HTTPException(
            status_code=422,
            detail="No hay proveedores disponibles para este tipo de evento y fecha",
        )

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

    # 4b. Selección automática de paquete propio según invitados
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
                    "exceeds_max_range": pkg_result.exceeds_max_range,
                }
                if pkg_result.alert:
                    logger.warning("Package alert evento %d: %s", event.id, pkg_result.alert)
        except NoPackagesConfiguredError:
            pass

    available_budget = max(0.0, presupuesto_maximo - package_cost)

    # 5. Crear cotizaciones en BD (básica + premium)
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
        },
    )
    db.add(q_basica)
    db.add(q_premium)
    await db.flush()

    # 6. Optimizar
    opt_input = OptimizationInput(
        budget=available_budget,
        required_services=rule_result.required_services,
        optional_services=rule_result.optional_services,
        event_type=evento_tipo,
        event_date=event_date,
        providers=provider_options,
        quality_weight=quality_weight,
    )

    basica, premium, res_basica, res_premium = generate_proposals(
        base_input=opt_input,
        quotation_id_base=q_basica.id,
        quotation_id_premium=q_premium.id,
        evento_tipo=evento_tipo,
        evento_fecha=event_date,
        num_invitados=num_invitados,
        estilo=estilo,
        cliente_nombre=current_user.nombre,
        version=version,
    )

    # 7. Persistir detalles, logs y style_analysis
    style_json = style_result.model_dump() if style_result else None
    now = datetime.now(timezone.utc)
    for quotation, result, proposal in [
        (q_basica, res_basica, basica),
        (q_premium, res_premium, premium),
    ]:
        if result.feasible and proposal:
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

        quotation.style_analysis_json = style_json

        db.add(OptimizationLog(
            cotizacion_id=quotation.id,
            input_json=opt_input.model_dump(mode="json"),
            output_json=result.model_dump(mode="json"),
            algoritmo_usado=result.algorithm_used,
            duracion_ms=result.execution_ms,
            es_factible=result.feasible,
            created_at=now,
        ))

    await db.flush()

    return {
        "evento_id": event.id,
        "quotation_basica_id": q_basica.id,
        "quotation_premium_id": q_premium.id,
        "basica_factible": res_basica.feasible,
        "premium_factible": res_premium.feasible,
        "basica_costo": res_basica.total_cost if res_basica.feasible else None,
        "premium_costo": res_premium.total_cost if res_premium.feasible else None,
        "version": version,
        "style_detected": style_result.model_dump() if style_result and style_result.confidence > 0.3 else None,
        "package_selected": selected_pkg_info,
    }


@router.get("/")
async def list_my_quotations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista cotizaciones del usuario actual. Ejecutivos/admin ven todas."""
    base_query = (
        select(Quotation)
        .options(selectinload(Quotation.evento), selectinload(Quotation.cliente))
        .order_by(Quotation.created_at.desc())
        .limit(100)
    )
    if current_user.role == UserRole.CLIENTE:
        base_query = base_query.where(Quotation.cliente_id == current_user.id)

    result = await db.execute(base_query)
    quotations = list(result.scalars().all())

    return [
        {
            "id": q.id,
            "nivel": q.nivel.value,
            "estado": q.estado.value,
            "version": q.version,
            "costo_total": q.costo_total,
            "quality_score": q.quality_score,
            "created_at": q.created_at,
            "evento_id": q.evento_id,
            "evento_tipo": q.evento.tipo.value if q.evento else "otro",
            "evento_nombre": (
                f"{q.evento.tipo.value.capitalize()} — {q.evento.fecha.strftime('%d/%m/%Y')}"
                if q.evento else f"Evento #{q.evento_id}"
            ),
            "cliente_nombre": q.cliente.nombre if q.cliente else None,
        }
        for q in quotations
    ]


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Métricas de cotizaciones para el panel de control."""
    filters = []
    if current_user.role == UserRole.CLIENTE:
        filters.append(Quotation.cliente_id == current_user.id)

    count_result = await db.execute(
        select(Quotation.estado, func.count(Quotation.id))
        .where(*filters)
        .group_by(Quotation.estado)
    )
    counts = {row[0].value: row[1] for row in count_result.all()}

    completed_filters = [Quotation.estado == QuotationStatus.COMPLETADO] + filters
    avg_result = await db.execute(
        select(func.avg(Quotation.quality_score), func.avg(Quotation.costo_total))
        .where(*completed_filters)
    )
    avg_row = avg_result.one()

    return {
        "total": sum(counts.values()),
        "completadas": counts.get("completado", 0),
        "procesando": counts.get("procesando", 0),
        "con_error": counts.get("error", 0),
        "quality_score_promedio": round(avg_row[0], 3) if avg_row[0] else None,
        "costo_promedio": round(avg_row[1], 2) if avg_row[1] else None,
    }


@router.get("/{quotation_id}")
async def get_quotation(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener detalle de cotización por ID."""
    repo = QuotationRepository(db)
    q = await repo.get_by_id(quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    # Solo el dueño o ejecutivo/admin pueden ver
    if q.cliente_id != current_user.id and current_user.role == UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Sin acceso a esta cotización")

    return {
        "id": q.id,
        "nivel": q.nivel.value,
        "estado": q.estado.value,
        "version": q.version,
        "costo_total": q.costo_total,
        "quality_score": q.quality_score,
        "created_at": q.created_at,
        "evento_id": q.evento_id,
        # Información del evento para mostrar en UI sin join adicional
        "evento_tipo": q.evento.tipo.value if q.evento else None,
        "evento_fecha": q.evento.fecha.isoformat() if q.evento else None,
        "num_invitados": q.evento.num_invitados if q.evento else None,
        "estilo": q.evento.estilo if q.evento else None,
        "presupuesto_maximo": q.evento.presupuesto_maximo if q.evento else None,
        "style_analysis": q.style_analysis_json,
        "package_selected": q.parametros_json.get("package_selected") if q.parametros_json else None,
        "detalles": [
            {
                "id": d.id,
                "servicio": d.nombre_servicio,
                "proveedor": d.proveedor.nombre if d.proveedor else "",
                "proveedor_id": d.proveedor_id,
                "servicio_id": d.proveedor.servicio_id if d.proveedor else None,
                "costo": d.costo_negociado,
                "es_obligatorio": d.es_obligatorio,
                "indice_calidad": d.proveedor.indice_calidad if d.proveedor else 0,
            }
            for d in q.detalles
        ],
    }


class ReprocessRequest(BaseModel):
    presupuesto_maximo: float
    incluir_opcionales: bool = True


@router.post("/reprocess/{evento_id}", status_code=status.HTTP_202_ACCEPTED)
async def reprocess_quotation(
    evento_id: int,
    body: ReprocessRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    CU-02: Ajustar y reprocesar cotización con nuevo presupuesto.
    Crea nueva versión — nunca sobreescribe la anterior.
    """
    from backend.models.models import BusinessRule
    from backend.modules.rules_engine.schemas import RuleDefinition

    # Cargar evento original
    result = await db.execute(
        select(Event).where(Event.id == evento_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    if event.cliente_id != current_user.id and current_user.role == UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Sin acceso a este evento")

    # Motor de reglas
    db_rules_result = await db.execute(
        select(BusinessRule)
        .where(BusinessRule.tipo_evento == event.tipo)
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

    rule_inp = RuleEvaluationInput(
        event_type=event.tipo.value,
        num_invitados=event.num_invitados,
        rules=rule_definitions,
    )
    rule_result = evaluate_rules(rule_inp)

    # Si se excluyen opcionales, vaciar la lista
    if not body.incluir_opcionales:
        rule_result = rule_result.model_copy(update={"optional_services": []})

    # Catálogo de proveedores
    provider_repo = ProviderRepository(db)
    db_providers = await provider_repo.get_available_for_event(event.tipo, event.fecha)
    if not db_providers:
        raise HTTPException(status_code=422, detail="No hay proveedores disponibles")

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

    # Nueva versión
    quot_repo = QuotationRepository(db)
    version = await quot_repo.get_next_version(evento_id)

    q_basica = Quotation(
        cliente_id=event.cliente_id,
        evento_id=evento_id,
        version=version,
        nivel=QuotationLevel.BASICO,
        estado=QuotationStatus.PROCESANDO,
        parametros_json={
            "event_type": event.tipo.value,
            "num_invitados": event.num_invitados,
            "budget": body.presupuesto_maximo,
            "reprocess": True,
        },
    )
    q_premium = Quotation(
        cliente_id=event.cliente_id,
        evento_id=evento_id,
        version=version,
        nivel=QuotationLevel.PREMIUM,
        estado=QuotationStatus.PROCESANDO,
        parametros_json={
            "event_type": event.tipo.value,
            "num_invitados": event.num_invitados,
            "budget": body.presupuesto_maximo * 1.3,
            "reprocess": True,
        },
    )
    db.add(q_basica)
    db.add(q_premium)
    await db.flush()

    opt_input = OptimizationInput(
        budget=body.presupuesto_maximo,
        required_services=rule_result.required_services,
        optional_services=rule_result.optional_services,
        event_type=event.tipo.value,
        event_date=event.fecha,
        providers=provider_options,
    )

    basica, premium, res_basica, res_premium = generate_proposals(
        base_input=opt_input,
        quotation_id_base=q_basica.id,
        quotation_id_premium=q_premium.id,
        evento_tipo=event.tipo.value,
        evento_fecha=event.fecha,
        num_invitados=event.num_invitados,
        estilo=event.estilo,
        cliente_nombre=current_user.nombre,
        version=version,
    )

    now = datetime.now(timezone.utc)
    for quotation, result_opt, proposal in [
        (q_basica, res_basica, basica),
        (q_premium, res_premium, premium),
    ]:
        if result_opt.feasible and proposal:
            for sp in result_opt.selected_providers:
                db.add(QuotationDetail(
                    cotizacion_id=quotation.id,
                    proveedor_id=sp.provider_id,
                    costo_negociado=sp.costo,
                    es_obligatorio=sp.es_obligatorio,
                    nombre_servicio=sp.service_name,
                ))
            quotation.estado = QuotationStatus.COMPLETADO
            quotation.costo_total = result_opt.total_cost
            quotation.quality_score = result_opt.quality_score
        else:
            quotation.estado = QuotationStatus.ERROR

        db.add(OptimizationLog(
            cotizacion_id=quotation.id,
            input_json=opt_input.model_dump(mode="json"),
            output_json=result_opt.model_dump(mode="json"),
            algoritmo_usado=result_opt.algorithm_used,
            duracion_ms=result_opt.execution_ms,
            es_factible=result_opt.feasible,
            created_at=now,
        ))

    await db.flush()
    logger.info("Reproceso exitoso evento %d versión %d", evento_id, version)

    return {
        "evento_id": evento_id,
        "quotation_basica_id": q_basica.id,
        "quotation_premium_id": q_premium.id,
        "basica_factible": res_basica.feasible,
        "premium_factible": res_premium.feasible,
        "basica_costo": res_basica.total_cost if res_basica.feasible else None,
        "premium_costo": res_premium.total_cost if res_premium.feasible else None,
        "version": version,
    }


@router.get("/{quotation_id}/alternatives/{detalle_id}")
async def get_provider_alternatives(
    quotation_id: int,
    detalle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve proveedores alternativos para un detalle de cotización.
    Filtrados por mismo servicio y compatibilidad de tipo de evento.
    """
    # Cargar el detalle con su proveedor
    detail_result = await db.execute(
        select(QuotationDetail)
        .where(QuotationDetail.id == detalle_id)
        .where(QuotationDetail.cotizacion_id == quotation_id)
        .options(selectinload(QuotationDetail.proveedor))
    )
    detalle = detail_result.scalar_one_or_none()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")

    repo = QuotationRepository(db)
    q = await repo.get_by_id(quotation_id)
    if not q or (q.cliente_id != current_user.id and current_user.role == UserRole.CLIENTE):
        raise HTTPException(status_code=403, detail="Sin acceso")

    current_provider = detalle.proveedor
    servicio_id = current_provider.servicio_id
    event_type = q.evento.tipo.value if q.evento else None

    alt_result = await db.execute(
        select(Provider)
        .where(Provider.servicio_id == servicio_id)
        .where(Provider.id != current_provider.id)
        .where(Provider.is_active == True)  # noqa: E712
    )
    alternatives = list(alt_result.scalars().all())

    if event_type:
        alternatives = [
            a for a in alternatives
            if event_type in (a.tipos_evento_compatibles or [])
        ]

    alternatives.sort(key=lambda a: a.indice_calidad, reverse=True)

    return [
        {
            "id": a.id,
            "nombre": a.nombre,
            "costo": a.costo_base,
            "indice_calidad": a.indice_calidad,
            "delta_costo": round(a.costo_base - current_provider.costo_base, 2),
            "delta_quality": round(a.indice_calidad - current_provider.indice_calidad, 3),
        }
        for a in alternatives
    ]


class SwapProviderRequest(BaseModel):
    detalle_id: int
    new_provider_id: int


@router.post("/{quotation_id}/swap")
async def swap_provider(
    quotation_id: int,
    body: SwapProviderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Intercambia el proveedor de un servicio en una cotización completada.
    Recalcula costo_total y quality_score automáticamente.
    """
    repo = QuotationRepository(db)
    q = await repo.get_by_id(quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if q.cliente_id != current_user.id and current_user.role == UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Sin acceso")
    if q.estado != QuotationStatus.COMPLETADO:
        raise HTTPException(status_code=422, detail="Solo cotizaciones completadas pueden modificarse")

    detalle = next((d for d in q.detalles if d.id == body.detalle_id), None)
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado en esta cotización")

    new_prov_result = await db.execute(
        select(Provider).where(Provider.id == body.new_provider_id)
    )
    new_provider = new_prov_result.scalar_one_or_none()
    if not new_provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    # Validar que el nuevo proveedor ofrece el mismo servicio
    if new_provider.servicio_id != detalle.proveedor.servicio_id:
        raise HTTPException(status_code=422, detail="El proveedor no ofrece el mismo servicio")

    # Validar proveedor activo, compatible con tipo de evento y disponible en fecha
    if not new_provider.is_active:
        raise HTTPException(status_code=400, detail="El proveedor seleccionado no está activo")

    if q.evento:
        event_type = q.evento.tipo.value
        if event_type not in (new_provider.tipos_evento_compatibles or []):
            raise HTTPException(
                status_code=400,
                detail=f"El proveedor no es compatible con eventos de tipo '{event_type}'",
            )
        event_date_str = q.evento.fecha.isoformat()
        if event_date_str in (new_provider.fechas_no_disponibles or []):
            raise HTTPException(
                status_code=400,
                detail=f"El proveedor no está disponible en la fecha del evento ({event_date_str})",
            )

    # Actualizar detalle
    detalle.proveedor_id = new_provider.id
    detalle.costo_negociado = new_provider.costo_base
    await db.flush()

    # Recalcular totales usando datos en memoria (sustituir proveedor swapeado)
    total_cost = 0.0
    qualities = []
    response_detalles = []
    for d in q.detalles:
        if d.id == body.detalle_id:
            prov = new_provider
        else:
            prov = d.proveedor
        total_cost += d.costo_negociado
        qualities.append(prov.indice_calidad if prov else 0.0)
        response_detalles.append({
            "id": d.id,
            "servicio": d.nombre_servicio,
            "proveedor": prov.nombre if prov else "",
            "proveedor_id": d.proveedor_id,
            "servicio_id": prov.servicio_id if prov else None,
            "costo": d.costo_negociado,
            "es_obligatorio": d.es_obligatorio,
            "indice_calidad": prov.indice_calidad if prov else 0,
        })

    q.costo_total = total_cost
    q.quality_score = sum(qualities) / len(qualities) if qualities else 0.0
    await db.flush()

    logger.info(
        "Swap: cotización %d detalle %d → proveedor %d",
        quotation_id, body.detalle_id, body.new_provider_id,
    )

    return {
        "id": q.id,
        "costo_total": q.costo_total,
        "quality_score": q.quality_score,
        "detalles": response_detalles,
    }


@router.get("/{quotation_id}/pair")
async def get_quotation_pair(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Devuelve la cotización actual y su gemela (mismo evento+versión, nivel opuesto).
    Útil para comparación básica vs premium sin tener el estado de navegación.
    """
    repo = QuotationRepository(db)
    q = await repo.get_by_id(quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if q.cliente_id != current_user.id and current_user.role == UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Sin acceso")

    sibling_result = await db.execute(
        select(Quotation)
        .where(Quotation.evento_id == q.evento_id)
        .where(Quotation.version == q.version)
        .where(Quotation.id != quotation_id)
        .options(
            selectinload(Quotation.detalles).selectinload(QuotationDetail.proveedor)
        )
    )
    sibling = sibling_result.scalar_one_or_none()

    def _fmt(qt: Quotation) -> dict:
        return {
            "id": qt.id,
            "nivel": qt.nivel.value,
            "estado": qt.estado.value,
            "costo_total": qt.costo_total,
            "quality_score": qt.quality_score,
            "version": qt.version,
            "detalles": [
                {
                    "id": d.id,
                    "servicio": d.nombre_servicio,
                    "proveedor": d.proveedor.nombre if d.proveedor else "",
                    "proveedor_id": d.proveedor_id,
                    "servicio_id": d.proveedor.servicio_id if d.proveedor else None,
                    "costo": d.costo_negociado,
                    "es_obligatorio": d.es_obligatorio,
                    "indice_calidad": d.proveedor.indice_calidad if d.proveedor else 0,
                }
                for d in qt.detalles
            ],
        }

    return {
        "current": _fmt(q),
        "sibling": _fmt(sibling) if sibling else None,
    }


@router.get("/{quotation_id}/pdf")
async def download_pdf(
    quotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CU-01 paso 10: Generar y descargar PDF de propuesta."""
    repo = QuotationRepository(db)
    q = await repo.get_by_id(quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if q.estado != QuotationStatus.COMPLETADO:
        raise HTTPException(status_code=422, detail="La cotización aún no está completa")

    from backend.modules.pdf_gen.generator import is_pdf_available
    from backend.modules.proposal_gen.narrative import generate_narrative
    from backend.modules.proposal_gen.schemas import Proposal, ProposalItem
    from datetime import datetime, timezone

    # Obtener algoritmo real del log de optimización
    log_result = await db.execute(
        select(OptimizationLog)
        .where(OptimizationLog.cotizacion_id == quotation_id)
        .order_by(OptimizationLog.created_at.desc())
        .limit(1)
    )
    opt_log = log_result.scalar_one_or_none()
    algorithm_used = opt_log.algoritmo_usado if opt_log else "DESCONOCIDO"

    items = [
        ProposalItem(
            servicio=d.nombre_servicio,
            proveedor=d.proveedor.nombre if d.proveedor else "N/A",
            costo=d.costo_negociado,
            es_obligatorio=d.es_obligatorio,
            quality_index=d.proveedor.indice_calidad if d.proveedor else 0.5,
        )
        for d in q.detalles
    ]

    # Generar narrativa personalizada (Gemini) — retorna "" si falla, no bloquea
    style_data = q.style_analysis_json or {}
    narrative_text = await generate_narrative(
        evento_tipo=q.evento.tipo.value if q.evento else "otro",
        num_invitados=q.evento.num_invitados if q.evento else 0,
        evento_fecha=q.evento.fecha if q.evento else datetime.now(timezone.utc).date(),
        estilo=q.evento.estilo if q.evento else None,
        aesthetic_style=style_data.get("aesthetic_style"),
        style_keywords=style_data.get("style_keywords", []),
        servicios=[
            {"servicio": d.nombre_servicio, "proveedor": d.proveedor.nombre if d.proveedor else "", "costo": d.costo_negociado}
            for d in q.detalles
        ],
    )

    proposal = Proposal(
        quotation_id=q.id,
        nivel=q.nivel.value,
        evento_tipo=q.evento.tipo.value if q.evento else "otro",
        evento_fecha=q.evento.fecha if q.evento else datetime.now(timezone.utc).date(),
        num_invitados=q.evento.num_invitados if q.evento else 0,
        estilo=q.evento.estilo if q.evento else None,
        cliente_nombre=current_user.nombre,
        items=items,
        costo_total=q.costo_total or 0.0,
        quality_score=q.quality_score or 0.0,
        algorithm_used=algorithm_used,
        generated_at=datetime.now(timezone.utc),
        version=q.version,
        narrative=narrative_text,
    )

    content_bytes = generate_pdf(proposal)

    if is_pdf_available():
        filename = f"propuesta_{quotation_id}_{q.nivel.value}.pdf"
        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    else:
        # Fallback HTML imprimible (dev en Mac sin WeasyPrint nativo)
        filename = f"propuesta_{quotation_id}_{q.nivel.value}.html"
        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type="text/html; charset=utf-8",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
