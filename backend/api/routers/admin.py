"""
Endpoints de administración del sistema — solo ADMIN.
  - Configuración del optimizer (quality_weight)
  - Inspección de logs de optimización
"""
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies.auth import require_role
from backend.core.config_service import (
    DEFAULT_QUALITY_WEIGHT,
    QUALITY_WEIGHT_KEY,
    get_quality_weight,
    set_quality_weight,
)
from backend.core.database import get_db
from backend.models.models import OptimizationLog, User, UserRole
from backend.models.system_config import SystemConfig

router = APIRouter(prefix="/admin", tags=["Admin — Configuración"])


class OptimizerConfigResponse(BaseModel):
    quality_weight: float
    updated_at: str | None
    updated_by_email: str | None


class OptimizerConfigRequest(BaseModel):
    quality_weight: float = Field(..., ge=0.0, le=5.0)


@router.get("/optimizer-config", response_model=OptimizerConfigResponse)
async def get_optimizer_config(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Retorna la configuración actual del optimizer."""
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == QUALITY_WEIGHT_KEY)
    )
    config = result.scalar_one_or_none()

    if config is None:
        return OptimizerConfigResponse(
            quality_weight=DEFAULT_QUALITY_WEIGHT,
            updated_at=None,
            updated_by_email=None,
        )

    # Cargar email del usuario que lo actualizó
    updated_by_email: str | None = None
    if config.updated_by:
        user_result = await db.execute(
            select(User).where(User.id == config.updated_by)
        )
        user = user_result.scalar_one_or_none()
        if user:
            updated_by_email = user.email

    return OptimizerConfigResponse(
        quality_weight=float(config.value.get("value", DEFAULT_QUALITY_WEIGHT)),
        updated_at=config.updated_at.isoformat() if config.updated_at else None,
        updated_by_email=updated_by_email,
    )


@router.put("/optimizer-config", response_model=OptimizerConfigResponse)
async def update_optimizer_config(
    body: OptimizerConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    Actualiza quality_weight del optimizer.
    Rango válido: 0.0 (solo precio) – 5.0 (máxima calidad).
    """
    config = await set_quality_weight(db, body.quality_weight, current_user.id)
    return OptimizerConfigResponse(
        quality_weight=float(config.value["value"]),
        updated_at=config.updated_at.isoformat() if config.updated_at else None,
        updated_by_email=current_user.email,
    )


# ─── Optimization logs ────────────────────────────────────────────────────────

class OptimizationLogSummary(BaseModel):
    id: int
    cotizacion_id: int
    algoritmo_usado: str
    duracion_ms: int
    es_factible: bool
    created_at: str


class OptimizationLogDetail(BaseModel):
    id: int
    cotizacion_id: int
    algoritmo_usado: str
    duracion_ms: int
    es_factible: bool
    created_at: str
    input_json: dict[str, Any]
    output_json: dict[str, Any]


class PaginatedLogs(BaseModel):
    items: list[OptimizationLogSummary]
    total: int
    page: int
    page_size: int
    pages: int


@router.get("/optimization-logs", response_model=PaginatedLogs)
async def list_optimization_logs(
    algoritmo: str | None = Query(None, description="Filtrar por algoritmo: ILP o GREEDY"),
    fecha_desde: str | None = Query(None, description="ISO date — desde (inclusive)"),
    fecha_hasta: str | None = Query(None, description="ISO date — hasta (inclusive)"),
    cotizacion_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Lista paginada de logs de optimización con filtros opcionales."""
    filters = []
    if algoritmo:
        filters.append(OptimizationLog.algoritmo_usado == algoritmo.upper())
    if cotizacion_id is not None:
        filters.append(OptimizationLog.cotizacion_id == cotizacion_id)
    if fecha_desde:
        try:
            dt_from = datetime.fromisoformat(fecha_desde)
            filters.append(OptimizationLog.created_at >= dt_from)
        except ValueError:
            raise HTTPException(status_code=422, detail="fecha_desde inválida — usa formato ISO")
    if fecha_hasta:
        try:
            dt_to = datetime.fromisoformat(fecha_hasta)
            filters.append(OptimizationLog.created_at <= dt_to)
        except ValueError:
            raise HTTPException(status_code=422, detail="fecha_hasta inválida — usa formato ISO")

    base_q = select(OptimizationLog)
    if filters:
        base_q = base_q.where(and_(*filters))

    total_result = await db.execute(
        select(func.count()).select_from(base_q.subquery())
    )
    total: int = total_result.scalar_one()

    offset = (page - 1) * page_size
    rows_result = await db.execute(
        base_q.order_by(OptimizationLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = rows_result.scalars().all()

    return PaginatedLogs(
        items=[
            OptimizationLogSummary(
                id=r.id,
                cotizacion_id=r.cotizacion_id,
                algoritmo_usado=r.algoritmo_usado,
                duracion_ms=r.duracion_ms,
                es_factible=r.es_factible,
                created_at=r.created_at.isoformat(),
            )
            for r in rows
        ],
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, (total + page_size - 1) // page_size),
    )


@router.get("/optimization-logs/{log_id}", response_model=OptimizationLogDetail)
async def get_optimization_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Detalle completo de un log: incluye input_json y output_json."""
    result = await db.execute(
        select(OptimizationLog).where(OptimizationLog.id == log_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log no encontrado")

    return OptimizationLogDetail(
        id=log.id,
        cotizacion_id=log.cotizacion_id,
        algoritmo_usado=log.algoritmo_usado,
        duracion_ms=log.duracion_ms,
        es_factible=log.es_factible,
        created_at=log.created_at.isoformat(),
        input_json=log.input_json,
        output_json=log.output_json,
    )
