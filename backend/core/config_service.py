"""
Servicio de configuración del sistema.
Lee y escribe parámetros de optimizer desde system_config.
"""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.system_config import SystemConfig

QUALITY_WEIGHT_KEY = "quality_weight"
DEFAULT_QUALITY_WEIGHT = 1.0


async def get_quality_weight(db: AsyncSession) -> float:
    """
    Retorna quality_weight configurado por admin.
    Si no hay registro, retorna 1.0 (comportamiento estándar).
    """
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == QUALITY_WEIGHT_KEY)
    )
    config = result.scalar_one_or_none()
    if config is None:
        return DEFAULT_QUALITY_WEIGHT
    return float(config.value.get("value", DEFAULT_QUALITY_WEIGHT))


async def set_quality_weight(db: AsyncSession, value: float, user_id: int) -> SystemConfig:
    """Upsert quality_weight en system_config."""
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == QUALITY_WEIGHT_KEY)
    )
    config = result.scalar_one_or_none()

    if config is None:
        config = SystemConfig(
            key=QUALITY_WEIGHT_KEY,
            value={"value": value},
            updated_at=datetime.now(timezone.utc),
            updated_by=user_id,
        )
        db.add(config)
    else:
        config.value = {"value": value}
        config.updated_at = datetime.now(timezone.utc)
        config.updated_by = user_id

    await db.flush()
    return config
