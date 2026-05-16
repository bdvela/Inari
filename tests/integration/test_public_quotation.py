"""
Tests de integración — GET /api/v1/public/quotations/by-token

Verifica:
- Respuesta completa con token válido
- Ausencia de datos sensibles (proveedor, costo_base, margen, proveedor_id)
- Códigos de error correctos (401, 403, 404)
- Valores fijos de condiciones_pago
"""
import base64
import json
from datetime import date

import pytest
import pytest_asyncio
from jose import jwt as jose_jwt

from backend.core.config import get_settings
from backend.core.security import hash_password
from backend.models.models import (
    Event,
    EventType,
    Provider,
    Quotation,
    QuotationDetail,
    QuotationLevel,
    QuotationStatus,
    Service,
    User,
    UserRole,
)
from backend.modules.auth.client_tokens import ALGORITHM, create_client_token

PUBLIC_URL = "/api/v1/public/quotations/by-token"

# IDs resueltos en fixture de módulo
_ids: dict = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _has_key_recursive(obj: object, key: str) -> bool:
    """Búsqueda recursiva de clave en dict/list anidados."""
    if isinstance(obj, dict):
        if key in obj:
            return True
        return any(_has_key_recursive(v, key) for v in obj.values())
    if isinstance(obj, list):
        return any(_has_key_recursive(item, key) for item in obj)
    return False


def _make_tampered_token(valid_token: str) -> str:
    """Altera el payload del JWT — la firma deja de coincidir."""
    header_b64, payload_b64, signature = valid_token.split(".")
    padding = 4 - len(payload_b64) % 4
    decoded = json.loads(base64.urlsafe_b64decode(payload_b64 + "=" * padding))
    decoded["qid"] = decoded["qid"] + 9999
    new_payload = base64.urlsafe_b64encode(
        json.dumps(decoded).encode()
    ).rstrip(b"=").decode()
    return f"{header_b64}.{new_payload}.{signature}"


# ---------------------------------------------------------------------------
# Seed — una vez por módulo
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded(session_factory):
    """Crea usuario, evento, servicio, proveedor, cotizaciones y detalles."""
    async with session_factory() as session:
        cliente = User(
            nombre="Cliente PQ", email="cliente_pq@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.CLIENTE,
        )
        session.add(cliente)
        await session.flush()

        event = Event(
            cliente_id=cliente.id, tipo=EventType.BODA,
            fecha=date(2027, 8, 20), num_invitados=120,
            presupuesto_maximo=25000.0, estilo="rustico",
        )
        session.add(event)
        await session.flush()

        svc = Service(nombre="catering_pq", descripcion="Catering", tipo="catering")
        session.add(svc)
        await session.flush()

        provider = Provider(
            nombre="Catering Secreto SA",
            servicio_id=svc.id,
            costo_base=5000.0,
            indice_calidad=0.85,
            puntuacion_historica=0.8,
            experiencia_en_tipo_evento=0.9,
            tipos_evento_compatibles=["boda"],
            fechas_no_disponibles=[],
        )
        session.add(provider)
        await session.flush()

        # Cotización completada — la principal para los tests
        q_completed = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=1,
            nivel=QuotationLevel.BASICO, estado=QuotationStatus.COMPLETADO,
            costo_total=4800.0, quality_score=0.85,
            parametros_json={"event_type": "boda", "num_invitados": 120, "budget": 25000.0},
        )
        # Cotización cancelada — para el test 403
        q_cancelled = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=2,
            nivel=QuotationLevel.BASICO, estado=QuotationStatus.CANCELADA,
        )
        session.add_all([q_completed, q_cancelled])
        await session.flush()

        detail = QuotationDetail(
            cotizacion_id=q_completed.id,
            proveedor_id=provider.id,
            costo_negociado=4800.0,
            es_obligatorio=True,
            nombre_servicio="Catering Gourmet",
        )
        session.add(detail)
        await session.flush()
        await session.commit()

        _ids["q_completed"] = q_completed.id
        _ids["q_cancelled"] = q_cancelled.id


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_token_valido_retorna_200_estructura_completa(client, seeded):
    token = create_client_token(quotation_id=_ids["q_completed"])
    r = await client.get(PUBLIC_URL, params={"token": token})
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == _ids["q_completed"]
    assert "evento" in body
    assert body["evento"]["tipo"] == "boda"
    assert body["evento"]["num_invitados"] == 120
    assert body["evento"]["estilo"] == "rustico"
    assert "servicios_externos" in body
    assert isinstance(body["servicios_externos"], list)
    assert "condiciones_pago" in body
    assert "versiones_anteriores" in body
    assert "expires_at" in body
    assert body["presupuesto_cliente"] == 25000.0
    assert body["costo_total"] == 4800.0


@pytest.mark.asyncio
async def test_response_no_contiene_clave_proveedor(client, seeded):
    """Ningún nivel del JSON debe exponer la clave 'proveedor'."""
    token = create_client_token(quotation_id=_ids["q_completed"])
    r = await client.get(PUBLIC_URL, params={"token": token})
    assert r.status_code == 200

    body = r.json()
    assert not _has_key_recursive(body, "proveedor"), (
        "La respuesta expone datos internos de proveedor"
    )


@pytest.mark.asyncio
async def test_response_no_contiene_campos_internos(client, seeded):
    """costo_base, margen, proveedor_id no deben aparecer en ningún nivel."""
    token = create_client_token(quotation_id=_ids["q_completed"])
    r = await client.get(PUBLIC_URL, params={"token": token})
    assert r.status_code == 200

    body = r.json()
    for campo in ("costo_base", "margen", "proveedor_id"):
        assert not _has_key_recursive(body, campo), (
            f"La respuesta expone campo interno: '{campo}'"
        )


@pytest.mark.asyncio
async def test_token_expirado_retorna_401(client, seeded):
    """Token con exp en el pasado → 401."""
    expired = jose_jwt.encode(
        {
            "sub": "client",
            "qid": _ids["q_completed"],
            "scope": ["view"],
            "exp": 1,  # Unix epoch 1 = ya expirado
        },
        get_settings().CLIENT_TOKEN_SECRET,
        algorithm=ALGORITHM,
    )
    r = await client.get(PUBLIC_URL, params={"token": expired})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_token_manipulado_retorna_401(client, seeded):
    """Payload alterado → firma inválida → 401."""
    valid_token = create_client_token(quotation_id=_ids["q_completed"])
    tampered = _make_tampered_token(valid_token)
    r = await client.get(PUBLIC_URL, params={"token": tampered})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_cotizacion_cancelada_retorna_403(client, seeded):
    """Token válido pero cotización en estado cancelada → 403."""
    token = create_client_token(quotation_id=_ids["q_cancelled"])
    r = await client.get(PUBLIC_URL, params={"token": token})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_condiciones_pago_valores_fijos(client, seeded):
    """condiciones_pago siempre devuelve los valores hardcodeados."""
    token = create_client_token(quotation_id=_ids["q_completed"])
    r = await client.get(PUBLIC_URL, params={"token": token})
    assert r.status_code == 200

    cp = r.json()["condiciones_pago"]
    assert cp["separacion"] == 500.0
    assert cp["primer_pago_porcentaje"] == 50.0
    assert cp["segundo_pago_porcentaje"] == 25.0
    assert cp["tercer_pago_porcentaje"] == 25.0
    assert cp["primer_pago_porcentaje"] + cp["segundo_pago_porcentaje"] + cp["tercer_pago_porcentaje"] == 100.0
