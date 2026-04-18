"""
Tests de integración — CU-01 (generar cotización) y CU-02 (reprocesar).

Visual analysis y storage mockeados para no requerir API key ni disco real.
Se semillan servicios, proveedores y reglas en el DB de prueba.
"""
import io
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from backend.models.models import (
    BusinessRule, EventType, Provider, Service
)
from backend.modules.visual_analysis.exceptions import VisualAnalysisError
from tests.integration.conftest import register_user, login_user, auth_headers

# ---------------------------------------------------------------------------
# Fixtures de datos de prueba
# ---------------------------------------------------------------------------

FUTURE_DATE = (date.today() + timedelta(days=90)).isoformat()


@pytest_asyncio.fixture(scope="module")
async def seeded_db(session_factory):
    """
    Siembra servicios, proveedores y reglas de negocio.
    Scope=module: una sola siembra para todos los tests de este módulo.
    """
    async with session_factory() as session:
        # Servicios obligatorios para boda
        svc_catering = Service(nombre="catering_test", descripcion="Catering", tipo="catering")
        svc_deco = Service(nombre="decoracion_test", descripcion="Decoración", tipo="decoracion")
        svc_foto = Service(nombre="fotografia_test", descripcion="Fotografía", tipo="fotografia")
        session.add_all([svc_catering, svc_deco, svc_foto])
        await session.flush()

        # Proveedores para cada servicio
        providers = [
            Provider(
                nombre="Catering Gourmet", servicio_id=svc_catering.id,
                costo_base=3000.0, indice_calidad=0.85,
                puntuacion_historica=0.8, experiencia_en_tipo_evento=0.9,
                tipos_evento_compatibles=["boda", "corporativo", "cumpleanos"],
                fechas_no_disponibles=[],
            ),
            Provider(
                nombre="Catering Express", servicio_id=svc_catering.id,
                costo_base=1500.0, indice_calidad=0.6,
                puntuacion_historica=0.6, experiencia_en_tipo_evento=0.65,
                tipos_evento_compatibles=["boda", "corporativo"],
                fechas_no_disponibles=[],
            ),
            Provider(
                nombre="Deco Jardín", servicio_id=svc_deco.id,
                costo_base=2000.0, indice_calidad=0.8,
                puntuacion_historica=0.75, experiencia_en_tipo_evento=0.85,
                tipos_evento_compatibles=["boda"],
                fechas_no_disponibles=[],
            ),
            Provider(
                nombre="Studio Pro", servicio_id=svc_foto.id,
                costo_base=2500.0, indice_calidad=0.9,
                puntuacion_historica=0.9, experiencia_en_tipo_evento=0.9,
                tipos_evento_compatibles=["boda", "corporativo", "cumpleanos"],
                fechas_no_disponibles=[],
            ),
        ]
        session.add_all(providers)
        await session.flush()

        # Reglas de negocio — los 3 servicios obligatorios para boda
        rules = [
            BusinessRule(tipo_evento=EventType.BODA, servicio_id=svc_catering.id,
                         es_obligatorio=True, condicion=None),
            BusinessRule(tipo_evento=EventType.BODA, servicio_id=svc_deco.id,
                         es_obligatorio=True, condicion=None),
            BusinessRule(tipo_evento=EventType.BODA, servicio_id=svc_foto.id,
                         es_obligatorio=True, condicion=None),
        ]
        session.add_all(rules)
        await session.commit()

    return True  # señal de que seed completó


@pytest_asyncio.fixture
async def user_token(client):
    await register_user(client, email="user_quot@test.com", nombre="Usuario Cuota")
    return await login_user(client, email="user_quot@test.com")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def mock_storage():
    """Mock de StorageService que no toca disco."""
    storage = MagicMock()
    storage.save = AsyncMock(return_value=("test/key.jpg", "http://test/images/key.jpg"))
    return storage


def generate_form_data(
    tipo: str = "boda",
    fecha: str | None = None,
    presupuesto: float = 20000,
    invitados: int = 100,
) -> dict:
    return {
        "evento_tipo": tipo,
        "evento_fecha": fecha or FUTURE_DATE,
        "num_invitados": str(invitados),
        "presupuesto_maximo": str(presupuesto),
    }


# ---------------------------------------------------------------------------
# CU-01 tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generate_quotation_no_image(client, user_token, seeded_db):
    """CU-01: genera cotización sin imagen — flujo más simple."""
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(),
            headers=auth_headers(user_token),
        )
    assert r.status_code == 202, r.text
    body = r.json()
    assert body["evento_id"] > 0
    assert body["quotation_basica_id"] > 0
    assert body["quotation_premium_id"] > 0
    assert body["version"] == 1


@pytest.mark.asyncio
async def test_generate_quotation_basic_feasible(client, user_token, seeded_db):
    """Con presupuesto amplio, básica debe ser factible."""
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(presupuesto=30000),
            headers=auth_headers(user_token),
        )
    assert r.status_code == 202
    body = r.json()
    assert body["basica_factible"] is True
    assert body["basica_costo"] is not None
    assert body["basica_costo"] > 0


@pytest.mark.asyncio
async def test_generate_quotation_insufficient_budget(client, user_token, seeded_db):
    """Con presupuesto muy bajo, básica no puede ser factible."""
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(presupuesto=100),
            headers=auth_headers(user_token),
        )
    assert r.status_code == 202
    body = r.json()
    assert body["basica_factible"] is False


@pytest.mark.asyncio
async def test_generate_quotation_with_image_analysis_fails(client, user_token, seeded_db):
    """Si análisis visual falla, flujo continúa sin él (CU-01 flujo alternativo)."""
    image_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal fake PNG header

    with (
        patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()),
        patch(
            "backend.api.routers.quotations.analyze_image",
            new_callable=AsyncMock,
            side_effect=VisualAnalysisError("API sin clave"),
        ),
    ):
        r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(),
            files={"image": ("test.png", io.BytesIO(image_bytes), "image/png")},
            headers=auth_headers(user_token),
        )
    assert r.status_code == 202
    body = r.json()
    assert body["evento_id"] > 0


@pytest.mark.asyncio
async def test_generate_requires_auth(client, seeded_db):
    r = await client.post("/api/v1/quotations/generate", data=generate_form_data())
    assert r.status_code == 401 or r.status_code == 403


# ---------------------------------------------------------------------------
# Quotation detail + list tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_quotations_empty_for_new_user(client):
    await register_user(client, email="empty_list@test.com")
    token = await login_user(client, email="empty_list@test.com")
    r = await client.get("/api/v1/quotations/", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_quotations_after_generate(client, seeded_db):
    await register_user(client, email="list_after@test.com")
    token = await login_user(client, email="list_after@test.com")

    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(),
            headers=auth_headers(token),
        )

    r = await client.get("/api/v1/quotations/", headers=auth_headers(token))
    assert r.status_code == 200
    items = r.json()
    # Debe haber 2 cotizaciones (básica + premium)
    assert len(items) == 2
    niveles = {item["nivel"] for item in items}
    assert "basico" in niveles
    assert "premium" in niveles


@pytest.mark.asyncio
async def test_get_quotation_detail(client, seeded_db):
    await register_user(client, email="detail@test.com")
    token = await login_user(client, email="detail@test.com")

    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        gen_r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(presupuesto=30000),
            headers=auth_headers(token),
        )
    basica_id = gen_r.json()["quotation_basica_id"]

    r = await client.get(f"/api/v1/quotations/{basica_id}", headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == basica_id
    assert body["nivel"] == "basico"
    assert "detalles" in body
    assert body["evento_id"] > 0


@pytest.mark.asyncio
async def test_get_quotation_not_found(client, user_token):
    r = await client.get("/api/v1/quotations/99999", headers=auth_headers(user_token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_get_quotation_other_user_forbidden(client, seeded_db):
    # Crear usuario A con cotización
    await register_user(client, email="owner@test.com")
    token_a = await login_user(client, email="owner@test.com")
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        gen_r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(),
            headers=auth_headers(token_a),
        )
    basica_id = gen_r.json()["quotation_basica_id"]

    # Usuario B intenta ver cotización de A
    await register_user(client, email="intruder@test.com")
    token_b = await login_user(client, email="intruder@test.com")
    r = await client.get(f"/api/v1/quotations/{basica_id}", headers=auth_headers(token_b))
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# CU-02: Reprocess tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_reprocess_creates_new_version(client, seeded_db):
    """CU-02: reproceso crea versión 2 — versión 1 preservada."""
    await register_user(client, email="reprocess@test.com")
    token = await login_user(client, email="reprocess@test.com")

    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        gen_r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(presupuesto=30000),
            headers=auth_headers(token),
        )
    assert gen_r.status_code == 202
    gen_body = gen_r.json()
    evento_id = gen_body["evento_id"]
    assert gen_body["version"] == 1

    # Reprocesar con más presupuesto
    r = await client.post(
        f"/api/v1/quotations/reprocess/{evento_id}",
        json={"presupuesto_maximo": 40000, "incluir_opcionales": True},
        headers=auth_headers(token),
    )
    assert r.status_code == 202, r.text
    reprocess_body = r.json()
    assert reprocess_body["version"] == 2
    assert reprocess_body["evento_id"] == evento_id
    assert reprocess_body["quotation_basica_id"] != gen_body["quotation_basica_id"]


@pytest.mark.asyncio
async def test_reprocess_nonexistent_event(client, user_token):
    r = await client.post(
        "/api/v1/quotations/reprocess/99999",
        json={"presupuesto_maximo": 10000, "incluir_opcionales": True},
        headers=auth_headers(user_token),
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_reprocess_other_user_event_forbidden(client, seeded_db):
    await register_user(client, email="owner2@test.com")
    token_owner = await login_user(client, email="owner2@test.com")
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        gen_r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(),
            headers=auth_headers(token_owner),
        )
    evento_id = gen_r.json()["evento_id"]

    await register_user(client, email="thief2@test.com")
    token_thief = await login_user(client, email="thief2@test.com")
    r = await client.post(
        f"/api/v1/quotations/reprocess/{evento_id}",
        json={"presupuesto_maximo": 10000, "incluir_opcionales": True},
        headers=auth_headers(token_thief),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_reprocess_without_optionals(client, seeded_db):
    """Reproceso sin opcionales debe ser factible si presupuesto cubre obligatorios."""
    await register_user(client, email="noopt@test.com")
    token = await login_user(client, email="noopt@test.com")
    with patch("backend.api.routers.quotations.get_storage", return_value=mock_storage()):
        gen_r = await client.post(
            "/api/v1/quotations/generate",
            data=generate_form_data(presupuesto=30000),
            headers=auth_headers(token),
        )
    evento_id = gen_r.json()["evento_id"]

    r = await client.post(
        f"/api/v1/quotations/reprocess/{evento_id}",
        json={"presupuesto_maximo": 10000, "incluir_opcionales": False},
        headers=auth_headers(token),
    )
    assert r.status_code == 202
    body = r.json()
    assert body["basica_factible"] is True  # sin opcionales, solo 3 proveedores obligatorios
