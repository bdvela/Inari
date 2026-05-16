"""
Tests de integración — GET /api/v1/public/quotations/by-token/pdf

En entorno dev (sin WeasyPrint nativo) el endpoint devuelve HTML imprimible.
Los tests verifican el contenido textual del body, lo que funciona en ambos
casos: HTML (dev) y PDF real (producción / Docker).

Nota sobre content-type: se acepta application/pdf o text/html según entorno.
"""
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

PDF_URL = "/api/v1/public/quotations/by-token/pdf"

PROVIDER_NAME = "Proveedor Secreto PDF SA"
NARRATIVE_TEXT = "Una propuesta única para una boda inolvidable en Lima."

_ids: dict = {}


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded(session_factory):
    """Crea datos mínimos para tests de PDF público."""
    async with session_factory() as session:
        cliente = User(
            nombre="Cliente PDF",
            email="cliente_pdf@test.com",
            hashed_password=hash_password("test1234"),
            role=UserRole.CLIENTE,
        )
        session.add(cliente)
        await session.flush()

        event = Event(
            cliente_id=cliente.id,
            tipo=EventType.BODA,
            fecha=date(2027, 10, 12),
            num_invitados=80,
            presupuesto_maximo=18000.0,
            estilo="moderno",
        )
        session.add(event)
        await session.flush()

        svc = Service(nombre="catering_pdf", descripcion="Catering", tipo="catering")
        session.add(svc)
        await session.flush()

        provider = Provider(
            nombre=PROVIDER_NAME,
            servicio_id=svc.id,
            costo_base=6000.0,
            indice_calidad=0.88,
            puntuacion_historica=0.85,
            experiencia_en_tipo_evento=0.90,
            tipos_evento_compatibles=["boda"],
            fechas_no_disponibles=[],
        )
        session.add(provider)
        await session.flush()

        # Cotización con narrativa en parametros_json
        q = Quotation(
            cliente_id=cliente.id,
            evento_id=event.id,
            version=1,
            nivel=QuotationLevel.BASICO,
            estado=QuotationStatus.COMPLETADO,
            costo_total=5800.0,
            quality_score=0.88,
            parametros_json={"narrative": NARRATIVE_TEXT},
        )
        session.add(q)
        await session.flush()

        detail = QuotationDetail(
            cotizacion_id=q.id,
            proveedor_id=provider.id,
            costo_negociado=5800.0,
            es_obligatorio=True,
            nombre_servicio="Catering Premium",
        )
        session.add(detail)
        await session.flush()
        await session.commit()

        _ids["q_id"] = q.id


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _body_text(response) -> str:
    """Decodifica el body de la respuesta como UTF-8 para búsqueda de texto."""
    return response.content.decode("utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_token_valido_retorna_contenido_pdf(client, seeded):
    """Token válido → respuesta 200 con content-type pdf o html (fallback dev)."""
    token = create_client_token(quotation_id=_ids["q_id"])
    r = await client.get(PDF_URL, params={"token": token})

    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "application/pdf" in ct or "text/html" in ct, (
        f"Content-Type inesperado: {ct}"
    )
    # Algo de contenido fue generado
    assert len(r.content) > 100


@pytest.mark.asyncio
async def test_pdf_no_contiene_nombre_proveedor(client, seeded):
    """show_providers=False → nombre real del proveedor NO debe aparecer en el output."""
    token = create_client_token(quotation_id=_ids["q_id"])
    r = await client.get(PDF_URL, params={"token": token})
    assert r.status_code == 200

    body = _body_text(r)
    assert PROVIDER_NAME not in body, (
        f"Nombre de proveedor '{PROVIDER_NAME}' no debería estar en la propuesta de cliente"
    )


@pytest.mark.asyncio
async def test_pdf_contiene_narrativa(client, seeded):
    """La narrativa almacenada en parametros_json aparece en el output."""
    token = create_client_token(quotation_id=_ids["q_id"])
    r = await client.get(PDF_URL, params={"token": token})
    assert r.status_code == 200

    body = _body_text(r)
    assert NARRATIVE_TEXT in body, (
        "La narrativa no aparece en el output de la propuesta"
    )


@pytest.mark.asyncio
async def test_pdf_contiene_condiciones_de_pago(client, seeded):
    """El template incluye condiciones de pago fijas: 500, 50%, 25%."""
    token = create_client_token(quotation_id=_ids["q_id"])
    r = await client.get(PDF_URL, params={"token": token})
    assert r.status_code == 200

    body = _body_text(r)
    assert "500" in body, "Separación S/ 500 no encontrada"
    assert "50%" in body, "Primer pago 50% no encontrado"
    assert "25%" in body, "Segundo/tercer pago 25% no encontrado"


@pytest.mark.asyncio
async def test_token_expirado_retorna_401(client, seeded):
    """Token con exp pasado → 401."""
    expired = jose_jwt.encode(
        {
            "sub": "client",
            "qid": _ids["q_id"],
            "scope": ["view"],
            "exp": 1,
        },
        get_settings().CLIENT_TOKEN_SECRET,
        algorithm=ALGORITHM,
    )
    r = await client.get(PDF_URL, params={"token": expired})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_content_disposition_incluye_tipo_evento(client, seeded):
    """Content-Disposition filename debe contener tipo de evento y fecha."""
    token = create_client_token(quotation_id=_ids["q_id"])
    r = await client.get(PDF_URL, params={"token": token})
    assert r.status_code == 200

    cd = r.headers.get("content-disposition", "")
    assert "boda" in cd, f"Tipo de evento no encontrado en Content-Disposition: {cd}"
    assert "2027" in cd, f"Año del evento no encontrado en Content-Disposition: {cd}"
