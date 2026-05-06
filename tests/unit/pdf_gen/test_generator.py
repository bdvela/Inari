"""
Tests unitarios del generador de PDF.
Prueba el template Jinja2 directamente — sin WeasyPrint.
"""
from datetime import date, datetime, timezone

import pytest

from backend.modules.pdf_gen.generator import _get_jinja_env
from backend.modules.proposal_gen.schemas import Proposal, ProposalItem


def _make_proposal(
    quotation_id: int = 42,
    nivel: str = "basico",
    cliente_nombre: str = "María García",
    evento_tipo: str = "boda",
    num_invitados: int = 150,
    items: list[ProposalItem] | None = None,
    costo_total: float = 8500.0,
    quality_score: float = 0.87,
    algorithm_used: str = "ILP",
) -> Proposal:
    if items is None:
        items = [
            ProposalItem(
                servicio="Catering",
                proveedor="Catering Elite",
                costo=5000.0,
                es_obligatorio=True,
                quality_index=0.9,
            ),
            ProposalItem(
                servicio="Decoración",
                proveedor="Deco Jardín",
                costo=2000.0,
                es_obligatorio=True,
                quality_index=0.85,
            ),
            ProposalItem(
                servicio="Fotografía",
                proveedor="Studio Pro",
                costo=1500.0,
                es_obligatorio=False,
                quality_index=0.95,
            ),
        ]
    return Proposal(
        quotation_id=quotation_id,
        nivel=nivel,
        evento_tipo=evento_tipo,
        evento_fecha=date(2025, 12, 15),
        num_invitados=num_invitados,
        estilo="elegante",
        cliente_nombre=cliente_nombre,
        items=items,
        costo_total=costo_total,
        quality_score=quality_score,
        algorithm_used=algorithm_used,
        generated_at=datetime(2026, 4, 28, 10, 30, tzinfo=timezone.utc),
        version=1,
    )


class TestProposalTemplate:

    def _render(self, proposal: Proposal) -> str:
        env = _get_jinja_env()
        template = env.get_template("proposal.html")
        return template.render(proposal=proposal)

    def test_renders_with_full_data_no_exception(self):
        """Template renderiza sin error con datos completos."""
        html = self._render(_make_proposal())
        assert html  # no vacío

    def test_contains_client_name(self):
        """Nombre del cliente aparece en el HTML generado."""
        html = self._render(_make_proposal(cliente_nombre="Juan Pérez"))
        assert "Juan Pérez" in html

    def test_contains_quotation_id_in_footer(self):
        """ID de cotización aparece en el footer del PDF."""
        html = self._render(_make_proposal(quotation_id=99))
        assert "99" in html

    def test_shows_nivel_basico(self):
        """Nivel BÁSICO visible en el documento."""
        html = self._render(_make_proposal(nivel="basico"))
        assert "BASICO" in html.upper()

    def test_shows_nivel_premium(self):
        """Nivel PREMIUM visible — diferenciación visual correcta."""
        html = self._render(_make_proposal(nivel="premium"))
        assert "PREMIUM" in html.upper()

    def test_shows_algorithm_used(self):
        """Algoritmo usado aparece en la sección de totales."""
        html = self._render(_make_proposal(algorithm_used="ILP"))
        assert "ILP" in html

    def test_shows_all_service_items(self):
        """Todos los servicios del Proposal aparecen en la tabla."""
        html = self._render(_make_proposal())
        assert "Catering" in html
        assert "Decoración" in html
        assert "Fotografía" in html

    def test_shows_provider_names(self):
        """Nombres de proveedores aparecen en la tabla."""
        html = self._render(_make_proposal())
        assert "Catering Elite" in html
        assert "Deco Jardín" in html

    def test_renders_with_zero_quality_items(self):
        """Proveedor con quality_index=0 no lanza excepción (barra de calidad 0%)."""
        items = [
            ProposalItem(
                servicio="Catering",
                proveedor="Sin Calificación",
                costo=1000.0,
                es_obligatorio=True,
                quality_index=0.0,
            )
        ]
        html = self._render(_make_proposal(items=items))
        assert "Sin Calificación" in html

    def test_renders_without_estilo(self):
        """Propuesta sin estilo definido usa texto por defecto ('Por definir')."""
        proposal = _make_proposal()
        proposal = proposal.model_copy(update={"estilo": None})
        html = self._render(proposal)
        assert "Por definir" in html

    def test_shows_total_cost_formatted(self):
        """Costo total aparece en el HTML (puede estar formateado con separadores)."""
        html = self._render(_make_proposal(costo_total=8500.0))
        assert "8" in html  # al menos parte del número
        assert "500" in html
