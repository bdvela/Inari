"""Tests del motor de reglas de negocio."""
import pytest

from backend.modules.rules_engine.engine import evaluate_rules
from backend.modules.rules_engine.schemas import RuleDefinition, RuleEvaluationInput


class TestRulesEngineDefaults:
    """Motor usa reglas por defecto cuando no hay reglas en BD."""

    def test_boda_tiene_servicios_obligatorios(self):
        inp = RuleEvaluationInput(event_type="boda", num_invitados=100, rules=[])
        result = evaluate_rules(inp)
        assert len(result.required_services) > 0
        assert "catering" in result.required_services
        assert "decoracion" in result.required_services

    def test_corporativo_tiene_sonido_obligatorio(self):
        inp = RuleEvaluationInput(event_type="corporativo", num_invitados=50, rules=[])
        result = evaluate_rules(inp)
        assert "sonido" in result.required_services

    def test_tipo_desconocido_usa_fallback(self):
        inp = RuleEvaluationInput(event_type="otro", num_invitados=30, rules=[])
        result = evaluate_rules(inp)
        assert len(result.required_services) >= 1

    def test_boda_tiene_opcionales(self):
        inp = RuleEvaluationInput(event_type="boda", num_invitados=100, rules=[])
        result = evaluate_rules(inp)
        assert len(result.optional_services) > 0


class TestRulesEngineCustomRules:
    """Motor usa reglas configuradas desde BD."""

    def test_regla_obligatoria_aplica(self):
        rules = [
            RuleDefinition(service_id="1", service_name="catering", es_obligatorio=True),
            RuleDefinition(service_id="2", service_name="decoracion", es_obligatorio=False),
        ]
        inp = RuleEvaluationInput(event_type="boda", num_invitados=100, rules=rules)
        result = evaluate_rules(inp)

        assert "1" in result.required_services
        assert "2" in result.optional_services

    def test_condicion_min_invitados_aplica(self):
        """Regla con min_invitados=100 no aplica para 50 invitados."""
        rules = [
            RuleDefinition(
                service_id="7", service_name="seguridad",
                es_obligatorio=True,
                condicion={"min_invitados": 100}
            ),
        ]
        inp = RuleEvaluationInput(event_type="boda", num_invitados=50, rules=rules)
        result = evaluate_rules(inp)
        # No debe incluir seguridad (solo 50 invitados, mínimo 100)
        assert "7" not in result.required_services

    def test_condicion_min_invitados_cumplida(self):
        """Regla con min_invitados=50 SÍ aplica para 150 invitados."""
        rules = [
            RuleDefinition(
                service_id="7", service_name="seguridad",
                es_obligatorio=True,
                condicion={"min_invitados": 50}
            ),
        ]
        inp = RuleEvaluationInput(event_type="boda", num_invitados=150, rules=rules)
        result = evaluate_rules(inp)
        assert "7" in result.required_services

    def test_sin_reglas_usa_defaults(self):
        inp = RuleEvaluationInput(event_type="boda", num_invitados=100, rules=[])
        result = evaluate_rules(inp)
        assert result.required_services  # debe tener algo
