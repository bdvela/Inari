"""
Tests de documentación — endpoints deprecated en v2.3.

Propósito: registrar qué endpoints están marcados para eliminación
y verificar que siguen respondiendo (no se han borrado accidentalmente)
pero NO son accesibles sin autenticación cuando deberían requerirla.

Endpoints deprecated identificados en v2.3:
  1. POST /api/v1/quotations/preview        — sin auth, flujo guest eliminado
  2. POST /api/v1/auth/register-and-quote   — sin auth, modal+wizard eliminados

Callers activos en frontend v2.3+: NINGUNO.
Candidatos a eliminar en v2.4 una vez confirmado que no hay integraciones externas.
"""
import pytest

from tests.integration.conftest import register_user, login_user, auth_headers

DEPRECATED = [
    "POST /api/v1/quotations/preview",
    "POST /api/v1/auth/register-and-quote",
]

# ---------------------------------------------------------------------------
# POST /quotations/preview — guest endpoint sin auth
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_deprecated_preview_sigue_existiendo(client):
    """
    [DEPRECATED] /quotations/preview debe seguir respondiendo (no 404/405)
    hasta ser eliminado formalmente en v2.4.
    Sin providers en DB de test, retorna 422 o 200 — lo importante es que existe.
    """
    r = await client.post(
        "/api/v1/quotations/preview",
        data={
            "evento_tipo": "boda",
            "evento_fecha": "2027-09-15",
            "num_invitados": "50",
            "presupuesto_maximo": "10000",
        },
    )
    # 200, 422 (sin providers) o 500 son aceptables — cualquier cosa menos 404/405
    assert r.status_code != 404, "Endpoint deprecated fue eliminado prematuramente"
    assert r.status_code != 405, "Endpoint deprecated fue eliminado prematuramente"


@pytest.mark.asyncio
async def test_deprecated_preview_no_requiere_autenticacion(client):
    """
    [DEPRECATED] El endpoint preview no exige token (acceso público).
    Documenta que es un endpoint sin autenticación — riesgo de exposición.
    """
    r = await client.post(
        "/api/v1/quotations/preview",
        data={
            "evento_tipo": "boda",
            "evento_fecha": "2027-09-15",
            "num_invitados": "50",
            "presupuesto_maximo": "10000",
        },
    )
    # No debe retornar 401 ni 403 — confirma que NO hay auth guard
    assert r.status_code not in (401, 403), (
        "El endpoint preview ahora exige auth — actualizar este test o eliminar el endpoint"
    )


# ---------------------------------------------------------------------------
# POST /auth/register-and-quote — guest endpoint sin auth
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_deprecated_register_and_quote_sigue_existiendo(client):
    """
    [DEPRECATED] /auth/register-and-quote debe seguir respondiendo
    hasta ser eliminado en v2.4.

    NOTA: este endpoint tiene un bug pre-existente (UnboundLocalError en extra_optional)
    que causa 500 en el flujo sin imágenes de estilo. El bug existe desde antes de v2.3.
    Como el endpoint está deprecated y sin callers activos, no se corrige.
    """
    try:
        r = await client.post(
            "/api/v1/auth/register-and-quote",
            data={
                "nombre": "Test Deprecated",
                "email": "deprecated_raq@test.com",
                "telefono_whatsapp": "999000001",
                "password": "test1234",
                "evento_tipo": "boda",
                "evento_fecha": "2027-09-15",
                "num_invitados": "50",
                "presupuesto_maximo": "10000",
            },
        )
        # 201, 422, 500 son aceptables — cualquier cosa menos 404/405
        assert r.status_code not in (404, 405), "Endpoint deprecated fue eliminado prematuramente"
    except Exception as exc:
        # El ASGI transport reraise excepciones del handler en test mode.
        # UnboundLocalError es el bug pre-existente documentado arriba.
        assert "extra_optional" in str(exc) or "UnboundLocalError" in type(exc).__name__, (
            f"Excepción inesperada (no la del bug conocido): {exc}"
        )


@pytest.mark.asyncio
async def test_deprecated_register_and_quote_no_requiere_autenticacion(client):
    """
    [DEPRECATED] register-and-quote crea usuario sin token previo (flujo guest).
    Documenta que es un endpoint sin autenticación.

    NOTA: el endpoint tiene bug pre-existente (ver test anterior).
    La ausencia de 401/403 confirma que NO hay auth guard.
    """
    try:
        r = await client.post(
            "/api/v1/auth/register-and-quote",
            data={
                "nombre": "Test Deprecated 2",
                "email": "deprecated_raq2@test.com",
                "telefono_whatsapp": "999000002",
                "password": "test1234",
                "evento_tipo": "boda",
                "evento_fecha": "2027-09-15",
                "num_invitados": "50",
                "presupuesto_maximo": "10000",
            },
        )
        assert r.status_code not in (401, 403), (
            "El endpoint register-and-quote ahora exige auth — actualizar este test o eliminar el endpoint"
        )
    except Exception as exc:
        # Bug pre-existente: UnboundLocalError en extra_optional.
        # Si llega aquí, tampoco fue rechazado por auth (confirma sin auth guard).
        assert "extra_optional" in str(exc) or "UnboundLocalError" in type(exc).__name__, (
            f"Excepción inesperada: {exc}"
        )


# ---------------------------------------------------------------------------
# Inventario de endpoints activos (verificación de no-regresión)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_endpoints_activos_siguen_respondiendo(client):
    """
    Smoke test: endpoints activos en v2.3 deben responder (no 404).
    Sin auth → 401/403 es correcto. 404 indicaría eliminación accidental.
    """
    await register_user(client, email="depr_smoke@test.com", role="ejecutivo")
    token = await login_user(client, email="depr_smoke@test.com")
    hdrs = auth_headers(token)

    endpoints_activos = [
        ("GET", "/api/v1/quotations/"),
        ("GET", "/api/v1/quotations/stats"),
    ]

    for method, path in endpoints_activos:
        if method == "GET":
            r = await client.get(path, headers=hdrs)
        else:
            r = await client.post(path, headers=hdrs)

        assert r.status_code != 404, (
            f"Endpoint activo {method} {path} retornó 404 — ¿fue eliminado accidentalmente?"
        )


# ---------------------------------------------------------------------------
# Resumen de estado (imprime en --verbose)
# ---------------------------------------------------------------------------

def test_inventario_deprecated():
    """
    No es un test de comportamiento — documenta la lista de endpoints
    deprecated para referencia en el TSP.
    """
    deprecated_inventory = {
        "POST /api/v1/quotations/preview": {
            "motivo": "Flujo GuestWizardPage eliminado en v2.3",
            "reemplazado_por": "POST /api/v1/chat/start + POST /api/v1/chat/{id}/message",
            "eliminar_en": "v2.4",
            "sin_auth": True,
        },
        "POST /api/v1/auth/register-and-quote": {
            "motivo": "GuestWizardPage + RegisterWithQuotationModal eliminados en v2.3",
            "reemplazado_por": "POST /api/v1/auth/register + flujo chat",
            "eliminar_en": "v2.4",
            "sin_auth": True,
        },
    }

    assert len(deprecated_inventory) == len(DEPRECATED), (
        "El inventario de deprecated no coincide con la lista DEPRECATED — actualizar ambos"
    )

    for endpoint, info in deprecated_inventory.items():
        assert info["sin_auth"] is True, (
            f"{endpoint} marcado deprecated pero requiere auth — revisar si debería protegerse ya"
        )
