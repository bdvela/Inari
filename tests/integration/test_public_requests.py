"""
Tests de integración — solicitudes de ajuste desde enlace público.

POST /api/v1/public/quotations/by-token/requests
GET  /api/v1/public/quotations/by-token/requests
"""
from datetime import date

import pytest
import pytest_asyncio
from jose import jwt as jose_jwt

from backend.core.config import get_settings
from backend.core.security import hash_password
from backend.models.models import (
    Event, EventType, Provider, Quotation, QuotationLevel, QuotationStatus,
    Service, User, UserRole,
)
from backend.modules.auth.client_tokens import ALGORITHM, create_client_token
from tests.integration.conftest import auth_headers, login_user, register_user

POST_URL = "/api/v1/public/quotations/by-token/requests"
GET_URL  = "/api/v1/public/quotations/by-token/requests"

_ids: dict = {}
VALID_MESSAGE = "A" * 200  # exactamente 200 chars — mínimo válido


@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded(session_factory):
    async with session_factory() as session:
        cliente = User(
            nombre="Cliente Req", email="cliente_req@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.CLIENTE,
        )
        session.add(cliente)
        await session.flush()

        svc = Service(nombre="catering_req", descripcion="test", tipo="catering")
        session.add(svc)
        await session.flush()

        prov = Provider(
            nombre="Prov Req", servicio_id=svc.id,
            costo_base=2000.0, indice_calidad=0.75,
            puntuacion_historica=0.70, experiencia_en_tipo_evento=0.75,
            tipos_evento_compatibles=["boda"], fechas_no_disponibles=[], tier="basico",
        )
        session.add(prov)
        await session.flush()

        event = Event(
            cliente_id=cliente.id, tipo=EventType.BODA,
            fecha=date(2027, 5, 1), num_invitados=80,
            presupuesto_maximo=12000.0,
        )
        session.add(event)
        await session.flush()

        q = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=1,
            nivel=QuotationLevel.BASICO, estado=QuotationStatus.COMPLETADO,
            costo_total=2000.0, quality_score=0.75,
        )
        session.add(q)
        await session.flush()
        await session.commit()

        _ids["quotation_id"] = q.id
        _ids["cliente_id"]   = cliente.id


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_token_valido_crea_solicitud(client, seeded):
    token = create_client_token(quotation_id=_ids["quotation_id"])
    r = await client.post(
        POST_URL,
        params={"token": token},
        json={"mensaje": VALID_MESSAGE},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"] > 0
    assert body["estado"] == "pendiente"
    assert body["mensaje"] == VALID_MESSAGE


@pytest.mark.asyncio
async def test_post_mensaje_corto_retorna_422(client, seeded):
    """Mensaje < 200 chars → 422."""
    token = create_client_token(quotation_id=_ids["quotation_id"])
    r = await client.post(
        POST_URL,
        params={"token": token},
        json={"mensaje": "Demasiado corto"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_post_mensaje_largo_retorna_422(client, seeded):
    """Mensaje > 1000 chars → 422."""
    token = create_client_token(quotation_id=_ids["quotation_id"])
    r = await client.post(
        POST_URL,
        params={"token": token},
        json={"mensaje": "B" * 1001},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_get_lista_solicitudes_creadas(client, seeded):
    """Solicitud creada en test anterior aparece en GET."""
    token = create_client_token(quotation_id=_ids["quotation_id"])

    # Crear una segunda solicitud para tener datos
    await client.post(POST_URL, params={"token": token}, json={"mensaje": "C" * 250})

    r = await client.get(GET_URL, params={"token": token})
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    for item in items:
        assert "mensaje" in item
        assert "estado" in item
        assert "created_at" in item


@pytest.mark.asyncio
async def test_solicitud_creada_visible_para_staff(client, seeded):
    """QuotationRequest creada por público aparece en endpoint de staff."""
    token = create_client_token(quotation_id=_ids["quotation_id"])
    await client.post(POST_URL, params={"token": token}, json={"mensaje": "D" * 300})

    # Staff ve la solicitud
    await register_user(client, email="exec_req@test.com", role="ejecutivo")
    exec_token = await login_user(client, email="exec_req@test.com")

    r = await client.get(
        f"/api/v1/quotations/{_ids['quotation_id']}/requests",
        headers=auth_headers(exec_token),
    )
    assert r.status_code == 200
    requests = r.json()
    assert len(requests) >= 1


@pytest.mark.asyncio
async def test_sin_scope_retorna_403(client, seeded):
    """Token sin scope request_adjustment → 403."""
    no_scope_token = jose_jwt.encode(
        {
            "sub": "client",
            "qid": _ids["quotation_id"],
            "scope": ["view"],          # request_adjustment ausente
            "exp": 9999999999,
        },
        get_settings().CLIENT_TOKEN_SECRET,
        algorithm=ALGORITHM,
    )
    r = await client.post(
        POST_URL,
        params={"token": no_scope_token},
        json={"mensaje": VALID_MESSAGE},
    )
    assert r.status_code == 403
