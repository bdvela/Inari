"""
CU-03: CRUD de proveedores — solo accesible por Administrador.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies.auth import require_role
from backend.core.database import get_db
from backend.models.models import User, UserRole
from backend.models.repositories import ProviderRepository

router = APIRouter(prefix="/providers", tags=["Proveedores"])


class ProviderCreate(BaseModel):
    nombre: str
    servicio_id: int
    costo_base: float = Field(..., gt=0)
    indice_calidad: float = Field(0.5, ge=0.0, le=1.0)
    puntuacion_historica: float = Field(0.5, ge=0.0, le=1.0)
    experiencia_en_tipo_evento: float = Field(0.5, ge=0.0, le=1.0)
    tipos_evento_compatibles: list[str]
    fechas_no_disponibles: list[str] = []


class ProviderUpdate(BaseModel):
    nombre: str | None = None
    costo_base: float | None = None
    indice_calidad: float | None = None
    tipos_evento_compatibles: list[str] | None = None
    fechas_no_disponibles: list[str] | None = None
    is_active: bool | None = None


@router.get("/")
async def list_providers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.EJECUTIVO, UserRole.ADMIN)),
):
    repo = ProviderRepository(db)
    providers = await repo.get_all_active()
    return [
        {
            "id": p.id,
            "nombre": p.nombre,
            "servicio_id": p.servicio_id,
            "costo_base": p.costo_base,
            "indice_calidad": p.indice_calidad,
            "tipos_evento_compatibles": p.tipos_evento_compatibles,
            "is_active": p.is_active,
        }
        for p in providers
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_provider(
    data: ProviderCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    repo = ProviderRepository(db)
    provider = await repo.create(data.model_dump())
    return {"id": provider.id, "nombre": provider.nombre}


@router.put("/{provider_id}")
async def update_provider(
    provider_id: int,
    data: ProviderUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    repo = ProviderRepository(db)
    updated = await repo.update(
        provider_id, {k: v for k, v in data.model_dump().items() if v is not None}
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return {"id": updated.id, "nombre": updated.nombre}


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    repo = ProviderRepository(db)
    deleted = await repo.delete(provider_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
