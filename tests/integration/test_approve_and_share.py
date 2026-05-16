"""
Tests de integración — POST /quotations/{id}/approve-and-share

Siembra usuarios y cotizaciones directamente en DB (sin pasar por el
endpoint de generación) para aislar el comportamiento del endpoint de aprobación.
"""
from datetime import date

import pytest
import pytest_asyncio

from backend.core.security import hash_password
from backend.models.models import (
    Event,
    EventType,
    Quotation,
    QuotationLevel,
    QuotationStatus,
    User,
    UserRole,
)
from tests.integration.conftest import auth_headers, login_user

# IDs resueltos en el fixture de módulo
_ids: dict = {}

APPROVE_URL = "/api/v1/quotations/{id}/approve-and-share"


# ---------------------------------------------------------------------------
# Seed — una sola vez por módulo
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded(session_factory):
    """Crea usuarios + evento + cotizaciones directamente en DB."""
    async with session_factory() as session:
        cliente = User(
            nombre="Cliente AAS", email="cliente_aas@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.CLIENTE,
        )
        ejecutivo = User(
            nombre="Ejecutivo AAS", email="ejecutivo_aas@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.EJECUTIVO,
        )
        admin = User(
            nombre="Admin AAS", email="admin_aas@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.ADMIN,
        )
        session.add_all([cliente, ejecutivo, admin])
        await session.flush()

        event = Event(
            cliente_id=cliente.id, tipo=EventType.BODA,
            fecha=date(2027, 6, 15), num_invitados=100,
            presupuesto_maximo=20000.0,
        )
        session.add(event)
        await session.flush()

        q_completed = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=1,
            nivel=QuotationLevel.BASICO, estado=QuotationStatus.COMPLETADO,
            costo_total=15000.0, quality_score=0.8,
        )
        q_completed2 = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=2,
            nivel=QuotationLevel.PREMIUM, estado=QuotationStatus.COMPLETADO,
            costo_total=18000.0, quality_score=0.9,
        )
        q_cancelled = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=3,
            nivel=QuotationLevel.BASICO, estado=QuotationStatus.CANCELADA,
        )
        session.add_all([q_completed, q_completed2, q_cancelled])
        await session.flush()
        await session.commit()

        _ids["q_completed"] = q_completed.id
        _ids["q_completed2"] = q_completed2.id
        _ids["q_cancelled"] = q_cancelled.id


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ejecutivo_aprueba_cotizacion_valida(client, seeded):
    """Happy path — ejecutivo aprueba y recibe URL + token."""
    token = await login_user(client, email="ejecutivo_aas@test.com")
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_completed"]),
        json={"expires_in_days": 30},
        headers=auth_headers(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["quotation_id"] == _ids["q_completed"]
    assert body["client_token"]
    assert "/p/" in body["client_url"]
    assert body["client_token"] in body["client_url"]
    assert body["expires_at"]
    assert body["quotation_status"] == "aprobada-enviada"


@pytest.mark.asyncio
async def test_admin_tambien_puede_aprobar(client, seeded):
    """Admin tiene permiso de aprobar — role check."""
    token = await login_user(client, email="admin_aas@test.com")
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_completed2"]),
        json={"expires_in_days": 7},
        headers=auth_headers(token),
    )
    assert r.status_code == 200
    assert r.json()["quotation_status"] == "aprobada-enviada"


@pytest.mark.asyncio
async def test_cliente_no_puede_aprobar_retorna_403(client, seeded):
    """CLIENTE no tiene rol EJECUTIVO/ADMIN → 403."""
    token = await login_user(client, email="cliente_aas@test.com")
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_completed"]),
        json={"expires_in_days": 30},
        headers=auth_headers(token),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_sin_auth_retorna_401_o_403(client, seeded):
    """Sin token → 401 o 403 (HTTPBearer devuelve 403 sin header)."""
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_completed"]),
        json={"expires_in_days": 30},
    )
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_cotizacion_inexistente_retorna_404(client, seeded):
    token = await login_user(client, email="ejecutivo_aas@test.com")
    r = await client.post(
        APPROVE_URL.format(id=999999),
        json={"expires_in_days": 30},
        headers=auth_headers(token),
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_cotizacion_cancelada_retorna_409(client, seeded):
    token = await login_user(client, email="ejecutivo_aas@test.com")
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_cancelled"]),
        json={"expires_in_days": 30},
        headers=auth_headers(token),
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_expires_in_days_mayor_90_retorna_422(client, seeded):
    """Validación Pydantic: expires_in_days > 90 → 422 antes de llegar al handler."""
    token = await login_user(client, email="ejecutivo_aas@test.com")
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_completed"]),
        json={"expires_in_days": 91},
        headers=auth_headers(token),
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_dos_aprobaciones_generan_tokens_distintos(client, seeded):
    """jti garantiza tokens únicos aunque el payload base sea igual."""
    token = await login_user(client, email="ejecutivo_aas@test.com")
    headers = auth_headers(token)
    body = {"expires_in_days": 30}

    r1 = await client.post(APPROVE_URL.format(id=_ids["q_completed"]), json=body, headers=headers)
    r2 = await client.post(APPROVE_URL.format(id=_ids["q_completed"]), json=body, headers=headers)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["client_token"] != r2.json()["client_token"]


@pytest.mark.asyncio
async def test_tras_aprobar_estado_es_aprobada_enviada(client, seeded):
    """Estado de cotización cambia correctamente después de aprobar."""
    exec_token = await login_user(client, email="ejecutivo_aas@test.com")
    # q_completed ya fue aprobado en tests anteriores — verificamos estado via GET
    r = await client.post(
        APPROVE_URL.format(id=_ids["q_completed"]),
        json={"expires_in_days": 15},
        headers=auth_headers(exec_token),
    )
    assert r.status_code == 200
    assert r.json()["quotation_status"] == "aprobada-enviada"
