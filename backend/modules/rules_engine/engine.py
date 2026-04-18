"""
Motor de reglas de negocio.

Evalúa qué servicios son obligatorios u opcionales dado el tipo de evento
y los parámetros del evento (invitados, fecha, etc.).

Las reglas vienen de la BD (configuradas por el admin) o del set por defecto.
El motor es stateless: recibe reglas + parámetros → devuelve clasificación.
"""
from backend.modules.rules_engine.schemas import (
    RuleDefinition,
    RuleEvaluationInput,
    RuleEvaluationResult,
)

# Reglas por defecto por tipo de evento.
# Usadas cuando la BD no tiene reglas configuradas (bootstrapping).
DEFAULT_REQUIRED_SERVICES: dict[str, list[str]] = {
    "boda": ["catering", "decoracion", "fotografia", "flores", "musica", "torta"],
    "corporativo": ["catering", "sonido", "iluminacion", "mobiliario"],
    "cumpleanos": ["catering", "decoracion", "fotografia", "torta"],
    "quinceanos": ["catering", "decoracion", "fotografia", "musica", "flores", "torta"],
    "conferencia": ["sonido", "iluminacion", "mobiliario", "catering"],
    "otro": ["catering"],
}

DEFAULT_OPTIONAL_SERVICES: dict[str, list[str]] = {
    "boda": ["videografia", "iluminacion", "transporte", "animacion", "maestro_de_ceremonias"],
    "corporativo": ["fotografia", "videografia", "transporte", "animacion"],
    "cumpleanos": ["musica", "animacion", "videografia", "flores"],
    "quinceanos": ["videografia", "iluminacion", "animacion", "transporte"],
    "conferencia": ["fotografia", "videografia", "transporte"],
    "otro": ["decoracion", "fotografia", "musica"],
}


def _evaluate_condition(condicion: dict | None, num_invitados: int) -> bool:
    """Evalúa condición adicional de una regla. True = regla aplica."""
    if not condicion:
        return True
    min_inv = condicion.get("min_invitados", 0)
    return num_invitados >= min_inv


def evaluate_rules(inp: RuleEvaluationInput) -> RuleEvaluationResult:
    """
    Aplica reglas de negocio y clasifica servicios en obligatorios/opcionales.

    Si hay reglas de BD, las usa. Si no, usa defaults para bootstrapping.
    """
    if inp.rules:
        # Usar reglas configuradas en BD
        required: list[str] = []
        optional: list[str] = []
        for rule in inp.rules:
            applies = _evaluate_condition(rule.condicion, inp.num_invitados)
            if not applies:
                continue
            if rule.es_obligatorio:
                required.append(rule.service_id)
            else:
                optional.append(rule.service_id)
        return RuleEvaluationResult(required_services=required, optional_services=optional)

    # Fallback a defaults (útil en desarrollo y demos)
    event = inp.event_type.lower()
    required = DEFAULT_REQUIRED_SERVICES.get(event, DEFAULT_REQUIRED_SERVICES["otro"])
    optional = DEFAULT_OPTIONAL_SERVICES.get(event, DEFAULT_OPTIONAL_SERVICES["otro"])
    return RuleEvaluationResult(required_services=required, optional_services=optional)
