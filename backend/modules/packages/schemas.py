"""Schemas del módulo de selección de paquetes de servicios propios."""
from pydantic import BaseModel


class ServicePackage(BaseModel):
    id: int
    name: str
    content: str
    cost: float
    min_guests: int
    max_guests: int


class PackageSelectionResult(BaseModel):
    selected_package: ServicePackage | None
    alert: str | None = None
    exceeds_max_range: bool = False


class PackageOverrideLog(BaseModel):
    original_package_id: int
    new_package_id: int
    justification: str
    executive_id: int
