"""Schemas del generador de propuestas."""
from datetime import date, datetime
from pydantic import BaseModel


class ProposalItem(BaseModel):
    servicio: str
    proveedor: str
    costo: float
    es_obligatorio: bool
    quality_index: float


class Proposal(BaseModel):
    quotation_id: int
    nivel: str  # "basico" o "premium"
    evento_tipo: str
    evento_fecha: date
    num_invitados: int
    estilo: str | None
    cliente_nombre: str
    items: list[ProposalItem]
    costo_total: float
    quality_score: float
    algorithm_used: str
    generated_at: datetime
    version: int
