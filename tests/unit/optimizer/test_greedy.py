"""
Tests unitarios del algoritmo Greedy.
Casos mínimos obligatorios del CLAUDE.md + casos adicionales.
"""
from datetime import date

import pytest

from backend.modules.optimizer.greedy import run_greedy
from backend.modules.optimizer.schemas import OptimizationInput, ProviderOption
from tests.unit.optimizer.conftest import make_provider


class TestGreedyFeasibleCases:
    """Casos donde la solución debe ser factible."""

    def test_presupuesto_suficiente_todos_servicios(self, base_input):
        """Caso 1: presupuesto suficiente para todos los servicios."""
        result = run_greedy(base_input)

        assert result.feasible is True
        assert result.total_cost <= base_input.budget
        assert result.quality_score > 0
        assert result.algorithm_used == "GREEDY"
        # Todos los servicios obligatorios deben estar cubiertos
        covered = {str(sp.service_id) for sp in result.selected_providers}
        for sid in base_input.required_services:
            assert sid in covered, f"Servicio obligatorio {sid} no cubierto"

    def test_selecciona_mejor_ratio_calidad_costo(self):
        """Greedy debe seleccionar el proveedor con mejor ratio quality/costo."""
        providers = [
            make_provider(1, 1, "catering", "Caro pero bueno", 5000, 1.0),
            make_provider(2, 1, "catering", "Barato y bueno", 1000, 0.9),  # mejor ratio
        ]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_greedy(inp)

        assert result.feasible is True
        # Debe seleccionar proveedor 2 (ratio 0.9/1000 = 0.0009) no 1 (ratio 1.0/5000 = 0.0002)
        assert result.selected_providers[0].provider_id == 2

    def test_presupuesto_justo_selecciona_mejor_ratio(self):
        """Caso 2: presupuesto ajustado — elige los de mejor ratio calidad/costo."""
        providers = [
            make_provider(1, 1, "catering", "Caro", 3000, 0.9),
            make_provider(2, 1, "catering", "Barato", 1000, 0.7),  # mejor ratio
            make_provider(3, 2, "deco", "Deco", 500, 0.8),
        ]
        inp = OptimizationInput(
            budget=2000,  # Solo alcanza para 1 servicio de catering barato + deco
            required_services=["1", "2"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_greedy(inp)

        assert result.feasible is True
        assert result.total_cost <= 2000
        # Catering debe ser el barato
        catering = next(sp for sp in result.selected_providers if sp.service_id == 1)
        assert catering.provider_id == 2

    def test_opcionales_incluidos_si_presupuesto_alcanza(self, base_input):
        """Servicios opcionales se incluyen si hay presupuesto sobrante."""
        result = run_greedy(base_input)
        service_ids = {str(sp.service_id) for sp in result.selected_providers}
        # Con 15000 de budget, opcionales (7=video, 8=ilum) deben entrar
        # (catering1500+deco800+foto1000+musica800+flores500+torta300 = 4900, sobran 10100)
        assert "7" in service_ids or "8" in service_ids  # al menos uno


class TestGreedyInfeasibleCases:
    """Casos donde la solución debe ser infactible."""

    def test_presupuesto_insuficiente_servicio_obligatorio(self):
        """Caso 3: presupuesto insuficiente para cubrir servicios obligatorios."""
        providers = [
            make_provider(1, 1, "catering", "Catering", 5000, 0.9),
        ]
        inp = OptimizationInput(
            budget=1000,  # Mucho menos que el costo mínimo
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_greedy(inp)

        assert result.feasible is False
        assert result.selected_providers == []
        assert "Presupuesto insuficiente" in result.reason

    def test_proveedor_no_disponible_en_fecha(self):
        """Caso 4: proveedor no disponible en la fecha del evento."""
        event_date = date(2025, 12, 25)
        providers = [
            make_provider(
                1, 1, "catering", "Catering Navidad",
                2000, 0.9,
                blocked_dates=[event_date.isoformat()]
            ),
        ]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=event_date,
            providers=providers,
        )
        result = run_greedy(inp)

        assert result.feasible is False
        assert result.selected_providers == []

    def test_proveedor_incompatible_tipo_evento(self):
        """Caso 5: proveedor incompatible con tipo de evento — no debe seleccionarse."""
        providers = [
            make_provider(
                1, 1, "catering", "Catering Solo Corporativo",
                2000, 0.9,
                event_types=["corporativo"]  # No compatible con boda
            ),
        ]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_greedy(inp)

        assert result.feasible is False

    def test_catalogo_vacio(self):
        """Caso 6: catálogo vacío → manejo graceful."""
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=[],
        )
        result = run_greedy(inp)

        assert result.feasible is False
        assert result.selected_providers == []

    def test_sin_proveedores_para_servicio_obligatorio(self):
        """Sin candidatos elegibles para servicio obligatorio → infeasible."""
        providers = [
            make_provider(1, 2, "decoracion", "Deco", 1000, 0.8),  # servicio 2, no 1
        ]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],  # Servicio 1 no tiene proveedores
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_greedy(inp)

        assert result.feasible is False
        assert "servicio obligatorio" in result.reason.lower()


class TestGreedyOutput:
    """Tests de estructura de salida."""

    def test_output_structure(self, base_input):
        result = run_greedy(base_input)
        assert hasattr(result, "selected_providers")
        assert hasattr(result, "total_cost")
        assert hasattr(result, "quality_score")
        assert hasattr(result, "algorithm_used")
        assert hasattr(result, "feasible")
        assert hasattr(result, "execution_ms")

    def test_total_cost_matches_sum(self, base_input):
        result = run_greedy(base_input)
        if result.feasible:
            expected = sum(sp.costo for sp in result.selected_providers)
            assert abs(result.total_cost - expected) < 0.01

    def test_quality_score_is_average(self, base_input):
        result = run_greedy(base_input)
        if result.feasible and result.selected_providers:
            expected = sum(sp.quality_index for sp in result.selected_providers) / len(result.selected_providers)
            assert abs(result.quality_score - expected) < 0.001

    def test_no_duplicate_services(self, base_input):
        """Un servicio no puede aparecer dos veces."""
        result = run_greedy(base_input)
        if result.feasible:
            service_ids = [sp.service_id for sp in result.selected_providers]
            assert len(service_ids) == len(set(service_ids)), "Hay servicios duplicados"

    def test_budget_constraint_respected(self, base_input):
        result = run_greedy(base_input)
        if result.feasible:
            assert result.total_cost <= base_input.budget + 0.01  # tolerancia float
