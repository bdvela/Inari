"""
Repositorio de proveedores. Toda lógica de acceso a BD de providers aquí.
"""
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.models import Provider, EventType


class ProviderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_all_active(self) -> list[Provider]:
        result = await self._session.execute(
            select(Provider)
            .where(Provider.is_active == True)  # noqa: E712
            .options(selectinload(Provider.servicio))
        )
        return list(result.scalars().all())

    async def get_by_id(self, provider_id: int) -> Provider | None:
        result = await self._session.execute(
            select(Provider).where(Provider.id == provider_id)
        )
        return result.scalar_one_or_none()

    async def get_available_for_event(
        self, event_type: EventType, event_date: date
    ) -> list[Provider]:
        """Filtra por tipo de evento compatible y sin fecha bloqueada."""
        all_active = await self.get_all_active()
        event_date_str = event_date.isoformat()
        return [
            p for p in all_active
            if event_type.value in p.tipos_evento_compatibles
            and event_date_str not in p.fechas_no_disponibles
        ]

    async def create(self, data: dict) -> Provider:
        provider = Provider(**data)
        self._session.add(provider)
        await self._session.flush()
        return provider

    async def update(self, provider_id: int, data: dict) -> Provider | None:
        provider = await self.get_by_id(provider_id)
        if not provider:
            return None
        for key, value in data.items():
            setattr(provider, key, value)
        await self._session.flush()
        return provider

    async def delete(self, provider_id: int) -> bool:
        """Soft delete: desactiva en lugar de eliminar."""
        provider = await self.get_by_id(provider_id)
        if not provider:
            return False
        provider.is_active = False
        await self._session.flush()
        return True
