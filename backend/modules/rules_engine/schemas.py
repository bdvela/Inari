"""Schemas del motor de reglas."""
from pydantic import BaseModel


class RuleDefinition(BaseModel):
    """Regla de negocio tal como viene de la BD."""
    service_id: str
    service_name: str
    es_obligatorio: bool
    condicion: dict | None = None  # e.g. {"min_invitados": 50}


class RuleEvaluationInput(BaseModel):
    event_type: str
    num_invitados: int
    rules: list[RuleDefinition]


class RuleEvaluationResult(BaseModel):
    required_services: list[str]   # service_id strings — obligatorios
    optional_services: list[str]   # service_id strings — opcionales permitidos
