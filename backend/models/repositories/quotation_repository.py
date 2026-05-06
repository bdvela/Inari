"""
Repositorio de cotizaciones. Las cotizaciones nunca se eliminan, solo se versionan.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.models import Quotation, QuotationDetail, OptimizationLog


class QuotationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, quotation_id: int) -> Quotation | None:
        result = await self._session.execute(
            select(Quotation)
            .where(Quotation.id == quotation_id)
            .options(
                selectinload(Quotation.detalles).selectinload(QuotationDetail.proveedor),
                selectinload(Quotation.evento),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_evento(self, evento_id: int) -> list[Quotation]:
        result = await self._session.execute(
            select(Quotation)
            .where(Quotation.evento_id == evento_id)
            .order_by(Quotation.version.desc())
            .options(selectinload(Quotation.detalles))
        )
        return list(result.scalars().all())

    async def get_by_cliente(self, cliente_id: int) -> list[Quotation]:
        result = await self._session.execute(
            select(Quotation)
            .where(Quotation.cliente_id == cliente_id)
            .order_by(Quotation.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_next_version(self, evento_id: int) -> int:
        """Calcula la siguiente versión para un evento."""
        result = await self._session.execute(
            select(Quotation.version)
            .where(Quotation.evento_id == evento_id)
            .order_by(Quotation.version.desc())
            .limit(1)
        )
        current = result.scalar_one_or_none()
        return (current or 0) + 1

    async def create(self, data: dict) -> Quotation:
        quotation = Quotation(**data)
        self._session.add(quotation)
        await self._session.flush()
        return quotation

    async def save_log(self, log: OptimizationLog) -> None:
        self._session.add(log)
        await self._session.flush()
