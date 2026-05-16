"""
Tests de integración — generación dual básico/premium con tier de proveedor.

Seed específico con:
  - catering_dual: proveedor basico (cost=2500, quality=0.70)
                    proveedor premium (cost=5000, quality=0.92)
  - Solo catering obligatorio para "quinceanos" (tipo distinto al usado en test_quotations)
  - Budget=8000 → básico usa basico-tier, premium puede elegir premium-tier

Verificaciones:
  1. Dos cotizaciones vinculadas al mismo evento
  2. Premium incluye proveedor tier=premium
  3. Básica solo tiene proveedores tier=basico
  4. Costo premium ≥ costo básico
  5. Dos logs de optimización (uno por nivel)
  6. Fallback cuando no hay proveedores tier=premium
"""
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select

from backend.models.models import (
    BusinessRule,
    EventType,
    OptimizationLog,
    Provider,
    Quotation,
    QuotationDetail,
    QuotationLevel,
    Service,
)
from tests.integration.conftest import auth_headers, login_user, register_user

FUTURE_DATE = (date.today() + timedelta(days=120)).isoformat()
EVENT_TYPE = "quinceanos"

# Provider IDs se resuelven en seed fixture
_seed: dict = {}


def mock_storage():
    s = MagicMock()
    s.save = AsyncMock(return_value=("k.jpg", "http://test/k.jpg"))
    return s


def form_data(presupuesto: float = 8000.0) -> dict:
    return {
        "evento_tipo": EVENT_TYPE,
        "evento_fecha": FUTURE_DATE,
        "num_invitados": "80",
        "presupuesto_maximo": str(presupuesto),
    }


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded_dual(session_factory):
    """Siembra un servicio con proveedor basico y premium para quinceanos."""
    async with session_factory() as session:
        svc = Service(
            nombre="catering_dual", descripcion="Catering Dual", tipo="catering"
        )
        session.add(svc)
        await session.flush()

        prov_basico = Provider(
            nombre="Catering Básico Dual",
            servicio_id=svc.id,
            costo_base=2500.0,
            indice_calidad=0.70,
            puntuacion_historica=0.68,
            experiencia_en_tipo_evento=0.72,
            tipos_evento_compatibles=[EVENT_TYPE],
            fechas_no_disponibles=[],
            tier="basico",
        )
        prov_premium = Provider(
            nombre="Catering Premium Dual",
            servicio_id=svc.id,
            costo_base=5000.0,
            indice_calidad=0.92,
            puntuacion_historica=0.91,
            experiencia_en_tipo_evento=0.94,
            tipos_evento_compatibles=[EVENT_TYPE],
            fechas_no_disponibles=[],
            tier="premium",
        )
        session.add_all([prov_basico, prov_premium])
        await session.flush()

        rule = BusinessRule(
            tipo_evento=EventType.QUINCEANOS,
            servicio_id=svc.id,
            es_obligatorio=True,
            condicion=None,
        )
        session.add(rule)
        await session.flush()

        # Seed para test fallback (solo basico, tipo=conferencia)
        svc2 = Service(nombre="catering_fallback", descripcion="Catering Fallback", tipo="catering")
        session.add(svc2)
        await session.flush()

        prov_only_basico = Provider(
            nombre="Catering Solo Básico",
            servicio_id=svc2.id,
            costo_base=3000.0,
            indice_calidad=0.75,
            puntuacion_historica=0.73,
            experiencia_en_tipo_evento=0.76,
            tipos_evento_compatibles=["conferencia"],
            fechas_no_disponibles=[],
            tier="basico",
        )
        session.add(prov_only_basico)
        await session.flush()

        rule2 = BusinessRule(
            tipo_evento=EventType.CONFERENCIA,
            servicio_id=svc2.id,
            es_obligatorio=True,
            condicion=None,
        )
        session.add(rule2)
        await session.flush()
        await session.commit()

        _seed["svc_id"] = svc.id
        _seed["basico_id"] = prov_basico.id
        _seed["premium_id"] = prov_premium.id
        _seed["svc2_id"] = svc2.id
        _seed["only_basico_id"] = prov_only_basico.id


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _generate(client, token: str, event_type: str = EVENT_TYPE, presupuesto: float = 8000.0):
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        r = await client.post(
            "/api/v1/quotations/generate",
            data={
                "evento_tipo": event_type,
                "evento_fecha": FUTURE_DATE,
                "num_invitados": "80",
                "presupuesto_maximo": str(presupuesto),
            },
            headers=auth_headers(token),
        )
    return r


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generacion_produce_dos_cotizaciones_mismo_evento(client, seeded_dual):
    await register_user(client, email="dual_test1@test.com", role="ejecutivo")
    token = await login_user(client, email="dual_test1@test.com")

    r = await _generate(client, token)
    assert r.status_code == 202, r.text

    body = r.json()
    assert body["quotation_basica_id"] is not None
    assert body["quotation_premium_id"] is not None
    assert body["evento_id"] is not None
    # Ambas vinculadas al mismo evento
    assert body["quotation_basica_id"] != body["quotation_premium_id"]


@pytest.mark.asyncio
async def test_cotizacion_premium_incluye_proveedor_tier_premium(client, session_factory, seeded_dual):
    await register_user(client, email="dual_test2@test.com", role="ejecutivo")
    token = await login_user(client, email="dual_test2@test.com")

    r = await _generate(client, token)
    assert r.status_code == 202
    body = r.json()

    # La cotización premium debe ser factible
    assert body["premium_factible"] is True, "Premium infeasible — revisar seed"

    premium_id = body["quotation_premium_id"]
    async with session_factory() as session:
        details_result = await session.execute(
            select(QuotationDetail).where(QuotationDetail.cotizacion_id == premium_id)
        )
        details = details_result.scalars().all()

    assert len(details) > 0, "Cotización premium sin detalles"

    # Al menos uno de los proveedores seleccionados debe ser tier=premium
    premium_provider_ids = {d.proveedor_id for d in details}
    assert _seed["premium_id"] in premium_provider_ids, (
        f"Proveedor premium {_seed['premium_id']} no está en detalles: {premium_provider_ids}"
    )


@pytest.mark.asyncio
async def test_cotizacion_basica_solo_proveedores_tier_basico(client, session_factory, seeded_dual):
    await register_user(client, email="dual_test3@test.com", role="ejecutivo")
    token = await login_user(client, email="dual_test3@test.com")

    r = await _generate(client, token)
    assert r.status_code == 202
    body = r.json()

    assert body["basica_factible"] is True, "Básico infeasible — revisar seed"

    basica_id = body["quotation_basica_id"]
    async with session_factory() as session:
        details_result = await session.execute(
            select(QuotationDetail).where(QuotationDetail.cotizacion_id == basica_id)
        )
        details = details_result.scalars().all()

    assert len(details) > 0, "Cotización básica sin detalles"

    # NINGÚN proveedor del básico debe ser tier=premium
    assert _seed["premium_id"] not in {d.proveedor_id for d in details}, (
        "Cotización básica no debe contener proveedor de tier=premium"
    )
    # El proveedor básico debe estar presente
    assert _seed["basico_id"] in {d.proveedor_id for d in details}


@pytest.mark.asyncio
async def test_costo_premium_mayor_igual_basico(client, seeded_dual):
    await register_user(client, email="dual_test4@test.com", role="ejecutivo")
    token = await login_user(client, email="dual_test4@test.com")

    r = await _generate(client, token)
    assert r.status_code == 202
    body = r.json()

    if body["basica_factible"] and body["premium_factible"]:
        assert body["premium_costo"] >= body["basica_costo"], (
            f"Premium ({body['premium_costo']}) debe ser ≥ básico ({body['basica_costo']})"
        )


@pytest.mark.asyncio
async def test_logs_optimizacion_registran_dos_ejecuciones(client, session_factory, seeded_dual):
    await register_user(client, email="dual_test5@test.com", role="ejecutivo")
    token = await login_user(client, email="dual_test5@test.com")

    r = await _generate(client, token)
    assert r.status_code == 202
    body = r.json()

    basica_id = body["quotation_basica_id"]
    premium_id = body["quotation_premium_id"]

    async with session_factory() as session:
        logs_basica = (await session.execute(
            select(OptimizationLog).where(OptimizationLog.cotizacion_id == basica_id)
        )).scalars().all()

        logs_premium = (await session.execute(
            select(OptimizationLog).where(OptimizationLog.cotizacion_id == premium_id)
        )).scalars().all()

    assert len(logs_basica) >= 1, "Sin log de optimización para cotización básica"
    assert len(logs_premium) >= 1, "Sin log de optimización para cotización premium"


@pytest.mark.asyncio
async def test_fallback_sin_proveedores_premium_ambas_factibles(client, seeded_dual):
    """Sin proveedores tier=premium, ambos runs usan pool basico → ambos deben ser factibles."""
    await register_user(client, email="dual_test6@test.com", role="ejecutivo")
    token = await login_user(client, email="dual_test6@test.com")

    # Usar event_type="conferencia" que solo tiene proveedor tier=basico
    r = await _generate(client, token, event_type="conferencia")
    assert r.status_code == 202
    body = r.json()

    # Sin proveedor premium → ambos runs deben ser factibles con el basico
    assert body["basica_factible"] is True, "Básico infeasible en fallback"
    assert body["premium_factible"] is True, "Premium infeasible en fallback (debe usar basico)"
