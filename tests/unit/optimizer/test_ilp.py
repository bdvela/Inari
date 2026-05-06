"""
Tests unitarios del algoritmo ILP.
Complementan test_greedy.py — verifican optimalidad garantizada del solver.
"""
from datetime import date

import pytest

from backend.modules.optimizer.greedy import run_greedy
from backend.modules.optimizer.ilp import run_ilp
from backend.modules.optimizer.schemas import OptimizationInput
from tests.unit.optimizer.conftest import make_provider


class TestILPFeasibleCases:

    def test_small_catalog_returns_feasible(self, base_input):
        """Catálogo pequeño (< 500 combinaciones) → ILP resuelve correctamente."""
        result = run_ilp(base_input)
        assert result.algorithm_used == "ILP"
        assert result.feasible is True
        assert result.total_cost > 0
        assert result.quality_score > 0

    def test_single_provider_per_service_selects_it(self):
        """Un solo proveedor por servicio → ILP selecciona el único candidato."""
        providers = [
            make_provider(1, 1, "catering", "Único Catering", 2000, 0.8),
            make_provider(2, 2, "decoracion", "Única Deco", 1500, 0.75),
        ]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1", "2"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)
        assert result.feasible is True
        selected_ids = {sp.provider_id for sp in result.selected_providers}
        assert 1 in selected_ids
        assert 2 in selected_ids

    def test_budget_exactly_fits_required_services(self):
        """Presupuesto exactamente igual al costo de los obligatorios → factible."""
        providers = [
            make_provider(1, 1, "catering", "Catering", 3000, 0.9),
            make_provider(2, 2, "decoracion", "Deco", 2000, 0.8),
        ]
        inp = OptimizationInput(
            budget=5000,  # exactamente 3000 + 2000
            required_services=["1", "2"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)
        assert result.feasible is True
        assert abs(result.total_cost - 5000) < 0.01

    def test_covers_all_required_services(self, base_input):
        """ILP debe cubrir todos los servicios obligatorios."""
        result = run_ilp(base_input)
        if result.feasible:
            covered = {str(sp.service_id) for sp in result.selected_providers}
            for sid in base_input.required_services:
                assert sid in covered, f"Servicio obligatorio {sid} no cubierto"

    def test_respects_budget_constraint(self, base_input):
        """Costo total no debe superar el presupuesto."""
        result = run_ilp(base_input)
        if result.feasible:
            assert result.total_cost <= base_input.budget + 0.01


class TestILPInfeasibleCases:

    def test_insufficient_budget_returns_infeasible(self):
        """Presupuesto insuficiente para servicio obligatorio → feasible=False."""
        providers = [make_provider(1, 1, "catering", "Catering Caro", 50000, 0.9)]
        inp = OptimizationInput(
            budget=100,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)
        assert result.feasible is False
        assert result.selected_providers == []
        assert result.algorithm_used == "ILP"

    def test_no_eligible_provider_for_required_service(self):
        """Sin proveedor elegible para servicio obligatorio → infeasible."""
        providers = [make_provider(1, 2, "decoracion", "Deco", 1000, 0.8)]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],  # servicio 1 no tiene proveedor
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)
        assert result.feasible is False

    def test_provider_incompatible_event_type_excluded(self):
        """Proveedor incompatible con tipo de evento → no seleccionado."""
        providers = [
            make_provider(1, 1, "catering", "Solo corporativo", 2000, 0.9, event_types=["corporativo"]),
        ]
        inp = OptimizationInput(
            budget=10000,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)
        assert result.feasible is False

    def test_does_not_raise_on_infeasible(self):
        """run_ilp no debe lanzar excepción cuando el problema es infactible."""
        providers = [make_provider(1, 1, "catering", "Caro", 999999, 0.9)]
        inp = OptimizationInput(
            budget=1,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)  # no debe lanzar
        assert result.feasible is False


class TestILPOptimalityVsGreedy:

    def test_ilp_quality_at_least_as_good_as_greedy(self, base_input):
        """
        ILP garantiza optimalidad: su quality_score >= Greedy para mismo input.
        ILP maximiza calidad total sujeto al presupuesto.
        """
        ilp_result = run_ilp(base_input)
        greedy_result = run_greedy(base_input)

        if ilp_result.feasible and greedy_result.feasible:
            # Comparar calidad total (suma, no promedio, para misma métrica base)
            ilp_total_quality = sum(sp.quality_index for sp in ilp_result.selected_providers)
            greedy_total_quality = sum(sp.quality_index for sp in greedy_result.selected_providers)
            assert ilp_total_quality >= greedy_total_quality - 0.001, (
                f"ILP quality={ilp_total_quality:.3f} < Greedy quality={greedy_total_quality:.3f}"
            )

    def test_ilp_selects_higher_quality_when_budget_tight(self):
        """Con presupuesto exacto, ILP elige el proveedor de mayor calidad factible."""
        providers = [
            make_provider(1, 1, "catering", "A — calidad alta", 3000, 0.95),
            make_provider(2, 1, "catering", "B — calidad baja", 2000, 0.5),
        ]
        inp = OptimizationInput(
            budget=4000,
            required_services=["1"],
            optional_services=[],
            event_type="boda",
            event_date=date(2025, 12, 15),
            providers=providers,
        )
        result = run_ilp(inp)
        assert result.feasible is True
        # ILP maximiza calidad → debe elegir A (0.95) si cabe en presupuesto
        assert result.selected_providers[0].provider_id == 1
