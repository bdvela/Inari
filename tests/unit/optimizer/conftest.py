"""
Fixtures compartidas para tests del optimizador.
"""
from datetime import date

import pytest

from backend.modules.optimizer.schemas import OptimizationInput, ProviderOption


def make_provider(
    id: int,
    service_id: int,
    service_name: str,
    nombre: str,
    costo: float,
    quality_index: float,
    event_types: list[str] | None = None,
    blocked_dates: list[str] | None = None,
) -> ProviderOption:
    return ProviderOption(
        id=id,
        service_id=service_id,
        service_name=service_name,
        nombre=nombre,
        costo=costo,
        quality_index=quality_index,
        tipos_evento_compatibles=event_types or ["boda", "corporativo", "cumpleanos"],
        fechas_no_disponibles=blocked_dates or [],
    )


@pytest.fixture
def boda_providers():
    """Catálogo básico de proveedores para eventos de boda."""
    return [
        make_provider(1, 1, "catering", "Catering Elite", 3000, 0.9),
        make_provider(2, 1, "catering", "Catering Express", 1500, 0.6),
        make_provider(3, 2, "decoracion", "Deco Jardín", 2000, 0.85),
        make_provider(4, 2, "decoracion", "Deco Básico", 800, 0.5),
        make_provider(5, 3, "fotografia", "Studio Pro", 2500, 0.95),
        make_provider(6, 3, "fotografia", "Foto Rápida", 1000, 0.65),
        make_provider(7, 4, "musica", "DJ Maestro", 1500, 0.8),
        make_provider(8, 4, "musica", "Grupo Musical", 800, 0.7),
        make_provider(9, 5, "flores", "Florería Premium", 1200, 0.88),
        make_provider(10, 5, "flores", "Florería Básica", 500, 0.55),
        make_provider(11, 6, "torta", "Pastelería Arte", 800, 0.92),
        make_provider(12, 6, "torta", "Pastelería Simple", 300, 0.6),
        # Opcionales
        make_provider(13, 7, "videografia", "Video Pro", 2000, 0.85),
        make_provider(14, 8, "iluminacion", "Light Show", 1000, 0.75),
    ]


@pytest.fixture
def base_input(boda_providers):
    return OptimizationInput(
        budget=15000,
        required_services=["1", "2", "3", "4", "5", "6"],
        optional_services=["7", "8"],
        event_type="boda",
        event_date=date(2025, 12, 15),
        providers=boda_providers,
    )
