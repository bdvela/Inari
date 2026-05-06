"""
RF-11: CRUD de reglas de negocio — accesible por Administrador.
Ejecutivo puede listar reglas y tipos de evento (solo lectura).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.api.dependencies.auth import require_role
from backend.core.database import get_db
from backend.models.models import BusinessRule, EventType, Service, User, UserRole

router = APIRouter(prefix="/rules", tags=["Reglas de Negocio"])


class RuleCreate(BaseModel):
    tipo_evento: str
    servicio_id: int
    es_obligatorio: bool = True
    condicion: dict | None = None
    descripcion: str | None = None


class RuleUpdate(BaseModel):
    es_obligatorio: bool | None = None
    condicion: dict | None = None
    descripcion: str | None = None


def _fmt_rule(r: BusinessRule) -> dict:
    return {
        "id": r.id,
        "tipo_evento": r.tipo_evento.value,
        "servicio_id": r.servicio_id,
        "servicio_nombre": r.servicio.nombre if r.servicio else str(r.servicio_id),
        "es_obligatorio": r.es_obligatorio,
        "condicion": r.condicion,
        "descripcion": r.descripcion,
    }


@router.get("/event-types/")
async def list_event_types(
    _: User = Depends(require_role(UserRole.EJECUTIVO, UserRole.ADMIN)),
):
    """Tipos de evento disponibles en el sistema."""
    return [{"value": e.value, "label": e.value.capitalize()} for e in EventType]


@router.get("/services/")
async def list_services(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.EJECUTIVO, UserRole.ADMIN)),
):
    """Lista de servicios disponibles para asignar a reglas."""
    result = await db.execute(
        select(Service).where(Service.is_active == True).order_by(Service.nombre)  # noqa: E712
    )
    services = list(result.scalars().all())
    return [{"id": s.id, "nombre": s.nombre, "tipo": s.tipo} for s in services]


@router.get("/")
async def list_rules(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.EJECUTIVO, UserRole.ADMIN)),
):
    """Lista todas las reglas de negocio registradas."""
    result = await db.execute(
        select(BusinessRule)
        .options(selectinload(BusinessRule.servicio))
        .order_by(BusinessRule.tipo_evento, BusinessRule.servicio_id)
    )
    rules = list(result.scalars().all())
    return [_fmt_rule(r) for r in rules]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_rule(
    data: RuleCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Crea una regla de negocio. La combinación (tipo_evento, servicio_id) es única."""
    try:
        event_type = EventType(data.tipo_evento)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Tipo de evento inválido: {data.tipo_evento}")

    # Verificar unicidad (constraint a nivel BD también protege)
    existing = await db.execute(
        select(BusinessRule)
        .where(
            BusinessRule.tipo_evento == event_type,
            BusinessRule.servicio_id == data.servicio_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe una regla para {data.tipo_evento} + servicio {data.servicio_id}",
        )

    rule = BusinessRule(
        tipo_evento=event_type,
        servicio_id=data.servicio_id,
        es_obligatorio=data.es_obligatorio,
        condicion=data.condicion,
        descripcion=data.descripcion,
    )
    db.add(rule)
    await db.flush()

    await db.refresh(rule, ["servicio"])
    return _fmt_rule(rule)


@router.put("/{rule_id}")
async def update_rule(
    rule_id: int,
    data: RuleUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Actualiza es_obligatorio, condicion o descripcion de una regla existente."""
    result = await db.execute(
        select(BusinessRule)
        .where(BusinessRule.id == rule_id)
        .options(selectinload(BusinessRule.servicio))
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada")

    if data.es_obligatorio is not None:
        rule.es_obligatorio = data.es_obligatorio
    if data.condicion is not None:
        rule.condicion = data.condicion
    if data.descripcion is not None:
        rule.descripcion = data.descripcion

    await db.flush()
    return _fmt_rule(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Elimina una regla de negocio."""
    result = await db.execute(select(BusinessRule).where(BusinessRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    await db.delete(rule)
    await db.flush()
