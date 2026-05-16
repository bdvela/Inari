"""
Tests de integración — endpoints de configuración del optimizer.

GET /api/v1/admin/optimizer-config
PUT /api/v1/admin/optimizer-config
"""
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select

from backend.models.models import (
    BusinessRule, EventType, OptimizationLog, Provider, Service,
)
from tests.integration.conftest import auth_headers, login_user, register_user

CONFIG_URL = "/api/v1/admin/optimizer-config"
FUTURE = (date.today() + timedelta(days=150)).isoformat()


# ---------------------------------------------------------------------------
# Seed para test de integración con optimizer (test 6)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded_config(session_factory):
    """Service, provider, rule para generar cotizaciones en el test de integración."""
    async with session_factory() as session:
        svc = Service(nombre="catering_config", descripcion="Catering", tipo="catering")
        session.add(svc)
        await session.flush()

        prov = Provider(
            nombre="Catering Config Test",
            servicio_id=svc.id,
            costo_base=3000.0,
            indice_calidad=0.80,
            puntuacion_historica=0.78,
            experiencia_en_tipo_evento=0.82,
            tipos_evento_compatibles=["otro"],
            fechas_no_disponibles=[],
            tier="basico",
        )
        session.add(prov)
        await session.flush()

        rule = BusinessRule(
            tipo_evento=EventType.OTRO,
            servicio_id=svc.id,
            es_obligatorio=True,
            condicion=None,
        )
        session.add(rule)
        await session.flush()
        await session.commit()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def mock_storage():
    s = MagicMock()
    s.save = AsyncMock(return_value=("k.jpg", "http://test/k.jpg"))
    return s


async def _get_admin_token(client):
    await register_user(client, email="cfg_admin@test.com", role="admin")
    return await login_user(client, email="cfg_admin@test.com")


async def _get_exec_token(client):
    await register_user(client, email="cfg_exec@test.com", role="ejecutivo")
    return await login_user(client, email="cfg_exec@test.com")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_retorna_default_1_0_sin_registro(client):
    """Sin fila en system_config → quality_weight = 1.0."""
    token = await _get_admin_token(client)
    r = await client.get(CONFIG_URL, headers=auth_headers(token))

    assert r.status_code == 200
    body = r.json()
    assert body["quality_weight"] == 1.0


@pytest.mark.asyncio
async def test_put_actualiza_valor(client):
    """PUT con 2.5 → GET retorna 2.5."""
    token = await _get_admin_token(client)

    r = await client.put(CONFIG_URL, json={"quality_weight": 2.5}, headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["quality_weight"] == 2.5

    r2 = await client.get(CONFIG_URL, headers=auth_headers(token))
    assert r2.json()["quality_weight"] == 2.5


@pytest.mark.asyncio
async def test_put_valor_6_retorna_422(client):
    token = await _get_admin_token(client)
    r = await client.put(CONFIG_URL, json={"quality_weight": 6.0}, headers=auth_headers(token))
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_put_valor_negativo_retorna_422(client):
    token = await _get_admin_token(client)
    r = await client.put(CONFIG_URL, json={"quality_weight": -1.0}, headers=auth_headers(token))
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_put_requiere_rol_admin(client):
    """Ejecutivo → 403."""
    token = await _get_exec_token(client)
    r = await client.put(CONFIG_URL, json={"quality_weight": 2.0}, headers=auth_headers(token))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_put_requiere_autenticacion(client):
    """Sin token → 401 o 403."""
    r = await client.put(CONFIG_URL, json={"quality_weight": 2.0})
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_cotizacion_usa_quality_weight_desde_config(client, session_factory, seeded_config):
    """
    Después de configurar quality_weight=3.0, la cotización generada
    sin imágenes de estilo debe pasar ese valor al optimizer.
    Se verifica en OptimizationLog.input_json.
    """
    # Resetear a valor conocido
    admin_token = await _get_admin_token(client)
    r = await client.put(
        CONFIG_URL, json={"quality_weight": 3.0}, headers=auth_headers(admin_token)
    )
    assert r.status_code == 200

    # Registrar un ejecutivo y generar cotización sin imágenes
    await register_user(client, email="cfg_quot_exec@test.com", role="ejecutivo")
    exec_token = await login_user(client, email="cfg_quot_exec@test.com")

    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        rq = await client.post(
            "/api/v1/quotations/generate",
            data={
                "evento_tipo": "otro",
                "evento_fecha": FUTURE,
                "num_invitados": "50",
                "presupuesto_maximo": "15000",
            },
            headers=auth_headers(exec_token),
        )

    assert rq.status_code == 202, rq.text
    body = rq.json()

    # Verificar el OptimizationLog tiene quality_weight=3.0
    basica_id = body["quotation_basica_id"]
    async with session_factory() as session:
        logs = (await session.execute(
            select(OptimizationLog).where(OptimizationLog.cotizacion_id == basica_id)
        )).scalars().all()

    assert len(logs) >= 1
    qw_in_log = logs[0].input_json.get("quality_weight")
    assert qw_in_log == 3.0, (
        f"OptimizationLog debería tener quality_weight=3.0, tiene {qw_in_log}"
    )
