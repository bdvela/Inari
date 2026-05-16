"""
Tests de integración — endpoints del asistente conversacional.

/api/v1/chat/start
/api/v1/chat/{session_id}/message
/api/v1/chat/{session_id}/confirm

parse_description mockeado para evitar llamadas a Gemini.
La tabla chat_sessions requiere que conftest.py importe chat_session model
(ya añadido) para que create_all la incluya.
"""
from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import update

from backend.models.chat_session import ChatSession
from backend.models.models import (
    BusinessRule,
    EventType,
    Provider,
    Service,
)
from backend.modules.visual_analysis.schemas import ParsedDescription
from tests.integration.conftest import auth_headers, login_user, register_user

CHAT_URL = "/api/v1/chat"

# Parámetros completos de prueba
FULL_PARSED = ParsedDescription(
    parseable=True,
    event_type="corporativo",
    guest_count=60,
    approximate_date="2027-03-20",
    max_budget=15000.0,
    confidence=0.9,
)
PARTIAL_PARSED = ParsedDescription(
    parseable=True,
    event_type="corporativo",
    guest_count=60,
    confidence=0.9,
)
SECOND_PARSED = ParsedDescription(
    parseable=True,
    event_type="corporativo",
    guest_count=60,
    approximate_date="2027-03-20",
    max_budget=15000.0,
    confidence=0.9,
)


# ---------------------------------------------------------------------------
# Seed — datos para pipeline de cotización en confirm
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded_chat(session_factory):
    """Siembra servicios, proveedores y reglas para evento corporativo."""
    async with session_factory() as session:
        svc = Service(nombre="catering_chat", descripcion="Catering", tipo="catering")
        session.add(svc)
        await session.flush()

        provider = Provider(
            nombre="Catering Chat Corp",
            servicio_id=svc.id,
            costo_base=5000.0,
            indice_calidad=0.80,
            puntuacion_historica=0.78,
            experiencia_en_tipo_evento=0.82,
            tipos_evento_compatibles=["corporativo"],
            fechas_no_disponibles=[],
        )
        session.add(provider)
        await session.flush()

        rule = BusinessRule(
            tipo_evento=EventType.CORPORATIVO,
            servicio_id=svc.id,
            es_obligatorio=True,
            condicion=None,
        )
        session.add(rule)
        await session.flush()
        await session.commit()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_flujo_completo_start_message_message_confirm(client, seeded_chat):
    """
    Flujo: start → mensaje parcial → mensaje completo → confirm.
    Resultado: quotation_id devuelto.
    """
    # Registrar usuario ejecutivo
    await register_user(client, email="chat_flujo@test.com", role="ejecutivo")
    token = await login_user(client, email="chat_flujo@test.com")
    headers = auth_headers(token)

    # 1. Start
    r = await client.post(f"{CHAT_URL}/start", headers=headers)
    assert r.status_code == 201
    body = r.json()
    session_id = body["session_id"]
    assert body["assistant_message"]

    # 2. Primer mensaje — extrae tipo + invitados
    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=PARTIAL_PARSED),
    ):
        r = await client.post(
            f"{CHAT_URL}/{session_id}/message",
            json={"message": "evento corporativo para 60 personas"},
            headers=headers,
        )
    assert r.status_code == 200
    body = r.json()
    assert body["extracted_params"]["tipo_evento"] == "corporativo"
    assert body["is_complete"] is False
    assert "fecha" in body["missing_fields"]
    assert "presupuesto" in body["missing_fields"]

    # 3. Segundo mensaje — completa fecha + presupuesto
    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=SECOND_PARSED),
    ):
        r = await client.post(
            f"{CHAT_URL}/{session_id}/message",
            json={"message": "el 20 de marzo 2027, presupuesto 15000 soles"},
            headers=headers,
        )
    assert r.status_code == 200
    body = r.json()
    assert body["is_complete"] is True
    assert body["missing_fields"] == []

    # 4. Confirm → genera cotización
    r = await client.post(
        f"{CHAT_URL}/{session_id}/confirm",
        json={},
        headers=headers,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["quotation_id"] is not None
    assert body["evento_id"] is not None
    assert "/quotations/" in body["redirect_to"]


@pytest.mark.asyncio
async def test_usuario_b_no_accede_a_sesion_de_usuario_a(client, seeded_chat):
    """Usuario B recibe 403 intentando usar la sesión de usuario A."""
    await register_user(client, email="chat_userA@test.com", role="ejecutivo")
    await register_user(client, email="chat_userB@test.com", role="ejecutivo")
    token_a = await login_user(client, email="chat_userA@test.com")
    token_b = await login_user(client, email="chat_userB@test.com")

    # A crea sesión
    r = await client.post(f"{CHAT_URL}/start", headers=auth_headers(token_a))
    assert r.status_code == 201
    session_id = r.json()["session_id"]

    # B intenta acceder → 403
    r = await client.post(
        f"{CHAT_URL}/{session_id}/message",
        json={"message": "hola"},
        headers=auth_headers(token_b),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_confirm_antes_de_is_complete_retorna_400(client, seeded_chat):
    """confirm con campos faltantes retorna 400."""
    await register_user(client, email="chat_incomplete@test.com", role="ejecutivo")
    token = await login_user(client, email="chat_incomplete@test.com")
    headers = auth_headers(token)

    # Crear sesión
    r = await client.post(f"{CHAT_URL}/start", headers=headers)
    session_id = r.json()["session_id"]

    # Solo tipo_evento, falta fecha y presupuesto
    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=PARTIAL_PARSED),
    ):
        await client.post(
            f"{CHAT_URL}/{session_id}/message",
            json={"message": "evento corporativo"},
            headers=headers,
        )

    # Intentar confirmar — debe fallar
    r = await client.post(
        f"{CHAT_URL}/{session_id}/confirm",
        json={},
        headers=headers,
    )
    assert r.status_code == 400
    assert "faltan campos" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_sesion_expirada_retorna_410(client, session_factory, seeded_chat):
    """Sesión con created_at > 24h retorna 410 Gone."""
    await register_user(client, email="chat_expired@test.com", role="ejecutivo")
    token = await login_user(client, email="chat_expired@test.com")
    headers = auth_headers(token)

    # Crear sesión
    r = await client.post(f"{CHAT_URL}/start", headers=headers)
    session_id = r.json()["session_id"]

    # Envejecer la sesión directamente en DB
    old_ts = datetime.now(timezone.utc) - timedelta(hours=25)
    async with session_factory() as session:
        await session.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(created_at=old_ts)
        )
        await session.commit()

    # Intentar enviar mensaje → 410
    r = await client.post(
        f"{CHAT_URL}/{session_id}/message",
        json={"message": "hola"},
        headers=headers,
    )
    assert r.status_code == 410


@pytest.mark.asyncio
async def test_mensaje_vacio_retorna_422(client, seeded_chat):
    """Body con message='' viola min_length=1 → 422."""
    await register_user(client, email="chat_empty@test.com", role="ejecutivo")
    token = await login_user(client, email="chat_empty@test.com")
    headers = auth_headers(token)

    r = await client.post(f"{CHAT_URL}/start", headers=headers)
    session_id = r.json()["session_id"]

    r = await client.post(
        f"{CHAT_URL}/{session_id}/message",
        json={"message": ""},
        headers=headers,
    )
    assert r.status_code == 422
