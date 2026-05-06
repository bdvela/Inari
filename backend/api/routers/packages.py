"""
CRUD de paquetes de servicios propios de INARI GROUP.
Solo Admin puede crear/editar/eliminar. Ejecutivo puede listar.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies.auth import require_role
from backend.core.database import get_db
from backend.models.models import BasePackage, User, UserRole

router = APIRouter(prefix="/packages", tags=["Paquetes de Servicios"])


class PackageCreate(BaseModel):
    name: str
    content: str
    cost: float
    min_guests: int
    max_guests: int


class PackageUpdate(BaseModel):
    name: str | None = None
    content: str | None = None
    cost: float | None = None
    min_guests: int | None = None
    max_guests: int | None = None
    is_active: bool | None = None


def _fmt(p: BasePackage) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "content": p.content,
        "cost": p.cost,
        "min_guests": p.min_guests,
        "max_guests": p.max_guests,
        "is_active": p.is_active,
    }


@router.get("/")
async def list_packages(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.EJECUTIVO, UserRole.ADMIN)),
):
    result = await db.execute(
        select(BasePackage).order_by(BasePackage.min_guests)
    )
    return [_fmt(p) for p in result.scalars().all()]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_package(
    data: PackageCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    if data.min_guests >= data.max_guests:
        raise HTTPException(status_code=422, detail="min_guests debe ser menor que max_guests")
    pkg = BasePackage(**data.model_dump())
    db.add(pkg)
    await db.flush()
    return _fmt(pkg)


@router.put("/{pkg_id}")
async def update_package(
    pkg_id: int,
    data: PackageUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(BasePackage).where(BasePackage.id == pkg_id))
    pkg = result.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(pkg, field, value)

    await db.flush()
    return _fmt(pkg)


@router.delete("/{pkg_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(
    pkg_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(BasePackage).where(BasePackage.id == pkg_id))
    pkg = result.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    await db.delete(pkg)
    await db.flush()
