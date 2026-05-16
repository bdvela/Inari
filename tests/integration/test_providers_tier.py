"""
Tests de integración — campo tier en proveedores (Básico/Premium).

Verifica que ProviderCreate y ProviderUpdate aceptan, validan y persisten
el campo tier correctamente.
"""
import pytest

from tests.integration.conftest import register_user, login_user, auth_headers

BASE_PROVIDER = {
    "nombre": "Proveedor Tier Test",
    "servicio_id": 1,
    "costo_base": 3000.0,
    "indice_calidad": 0.75,
    "puntuacion_historica": 0.70,
    "experiencia_en_tipo_evento": 0.75,
    "tipos_evento_compatibles": ["boda"],
    "fechas_no_disponibles": [],
}

PROVIDERS_URL = "/api/v1/providers/"


@pytest.fixture
async def admin_token(client):
    await register_user(client, email="admin_tier@test.com", role="admin")
    return await login_user(client, email="admin_tier@test.com")


# ---------------------------------------------------------------------------
# CREATE tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_provider_tier_basico(client, admin_token):
    """POST con tier='basico' lo persiste y lo expone en GET."""
    payload = {**BASE_PROVIDER, "nombre": "Tier Basico Test", "tier": "basico"}
    r = await client.post(PROVIDERS_URL, json=payload, headers=auth_headers(admin_token))
    assert r.status_code == 201

    # Verificar que aparece en listado con tier correcto
    r_list = await client.get(PROVIDERS_URL, headers=auth_headers(admin_token))
    assert r_list.status_code == 200
    match = [p for p in r_list.json() if p["nombre"] == "Tier Basico Test"]
    assert len(match) == 1
    assert match[0]["tier"] == "basico"


@pytest.mark.asyncio
async def test_create_provider_tier_premium(client, admin_token):
    """POST con tier='premium' lo persiste y lo expone en GET."""
    payload = {**BASE_PROVIDER, "nombre": "Tier Premium Test", "tier": "premium"}
    r = await client.post(PROVIDERS_URL, json=payload, headers=auth_headers(admin_token))
    assert r.status_code == 201

    r_list = await client.get(PROVIDERS_URL, headers=auth_headers(admin_token))
    match = [p for p in r_list.json() if p["nombre"] == "Tier Premium Test"]
    assert len(match) == 1
    assert match[0]["tier"] == "premium"


@pytest.mark.asyncio
async def test_create_provider_default_tier_basico(client, admin_token):
    """POST sin tier — default 'basico'."""
    payload = {**BASE_PROVIDER, "nombre": "Tier Default Test"}
    # No incluimos 'tier'
    r = await client.post(PROVIDERS_URL, json=payload, headers=auth_headers(admin_token))
    assert r.status_code == 201

    r_list = await client.get(PROVIDERS_URL, headers=auth_headers(admin_token))
    match = [p for p in r_list.json() if p["nombre"] == "Tier Default Test"]
    assert len(match) == 1
    assert match[0]["tier"] == "basico"


@pytest.mark.asyncio
async def test_create_provider_tier_invalid_returns_422(client, admin_token):
    """POST con tier='otro' (valor fuera del enum) → 422."""
    payload = {**BASE_PROVIDER, "nombre": "Tier Invalid Test", "tier": "otro"}
    r = await client.post(PROVIDERS_URL, json=payload, headers=auth_headers(admin_token))
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# UPDATE tests
# ---------------------------------------------------------------------------

async def _create_basico(client, token, nombre: str) -> int:
    """Helper: crea proveedor basico y retorna su id."""
    payload = {**BASE_PROVIDER, "nombre": nombre, "tier": "basico"}
    r = await client.post(PROVIDERS_URL, json=payload, headers=auth_headers(token))
    assert r.status_code == 201
    body = r.json()
    return body["id"]


@pytest.mark.asyncio
async def test_update_provider_change_tier(client, admin_token):
    """PUT cambia tier de 'basico' a 'premium'."""
    pid = await _create_basico(client, admin_token, "Tier Update Test")

    r = await client.put(
        f"{PROVIDERS_URL}{pid}",
        json={"tier": "premium"},
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 200

    r_list = await client.get(PROVIDERS_URL, headers=auth_headers(admin_token))
    match = [p for p in r_list.json() if p["id"] == pid]
    assert len(match) == 1
    assert match[0]["tier"] == "premium"


@pytest.mark.asyncio
async def test_update_provider_tier_invalid_returns_422(client, admin_token):
    """PUT con tier='otro' → 422."""
    pid = await _create_basico(client, admin_token, "Tier Invalid Update Test")

    r = await client.put(
        f"{PROVIDERS_URL}{pid}",
        json={"tier": "otro"},
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_update_provider_tier_omitted_preserves_existing(client, admin_token):
    """PUT sin tier no modifica el valor existente."""
    # Crear como premium
    payload = {**BASE_PROVIDER, "nombre": "Tier Preserve Test", "tier": "premium"}
    r = await client.post(PROVIDERS_URL, json=payload, headers=auth_headers(admin_token))
    pid = r.json()["id"]

    # Actualizar solo nombre, sin tocar tier
    r = await client.put(
        f"{PROVIDERS_URL}{pid}",
        json={"nombre": "Tier Preserve Test Updated"},
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 200

    r_list = await client.get(PROVIDERS_URL, headers=auth_headers(admin_token))
    match = [p for p in r_list.json() if p["id"] == pid]
    assert len(match) == 1
    assert match[0]["tier"] == "premium"  # no cambió
