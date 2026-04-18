"""
Tests de integración — CRUD de proveedores (CU-03).
Verifica control de acceso por rol y operaciones CRUD.
"""
import pytest

from tests.integration.conftest import register_user, login_user, auth_headers


VALID_PROVIDER = {
    "nombre": "Catering Test",
    "servicio_id": 1,
    "costo_base": 2500.0,
    "indice_calidad": 0.8,
    "puntuacion_historica": 0.75,
    "experiencia_en_tipo_evento": 0.7,
    "tipos_evento_compatibles": ["boda", "corporativo"],
    "fechas_no_disponibles": [],
}


@pytest.fixture
async def admin_token(client):
    await register_user(client, email="admin_prov@test.com", nombre="Admin", role="admin")
    return await login_user(client, email="admin_prov@test.com")


@pytest.fixture
async def ejecutivo_token(client):
    await register_user(client, email="ejec_prov@test.com", nombre="Ejecutivo", role="ejecutivo")
    return await login_user(client, email="ejec_prov@test.com")


@pytest.fixture
async def cliente_token(client):
    await register_user(client, email="cli_prov@test.com", nombre="Cliente", role="cliente")
    return await login_user(client, email="cli_prov@test.com")


@pytest.mark.asyncio
async def test_list_providers_ejecutivo(client, ejecutivo_token):
    r = await client.get("/api/v1/providers/", headers=auth_headers(ejecutivo_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_list_providers_admin(client, admin_token):
    r = await client.get("/api/v1/providers/", headers=auth_headers(admin_token))
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_list_providers_cliente_forbidden(client, cliente_token):
    r = await client.get("/api/v1/providers/", headers=auth_headers(cliente_token))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_provider_admin(client, admin_token):
    r = await client.post(
        "/api/v1/providers/",
        json=VALID_PROVIDER,
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"] > 0
    assert body["nombre"] == "Catering Test"


@pytest.mark.asyncio
async def test_create_provider_ejecutivo_forbidden(client, ejecutivo_token):
    r = await client.post(
        "/api/v1/providers/",
        json=VALID_PROVIDER,
        headers=auth_headers(ejecutivo_token),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_update_provider(client, admin_token):
    # Crear primero
    r = await client.post(
        "/api/v1/providers/",
        json=VALID_PROVIDER,
        headers=auth_headers(admin_token),
    )
    prov_id = r.json()["id"]

    # Actualizar
    r2 = await client.put(
        f"/api/v1/providers/{prov_id}",
        json={"costo_base": 3000.0, "is_active": True},
        headers=auth_headers(admin_token),
    )
    assert r2.status_code == 200
    assert r2.json()["id"] == prov_id


@pytest.mark.asyncio
async def test_update_nonexistent_provider(client, admin_token):
    r = await client.put(
        "/api/v1/providers/99999",
        json={"costo_base": 1000.0},
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_provider(client, admin_token):
    r = await client.post(
        "/api/v1/providers/",
        json=VALID_PROVIDER,
        headers=auth_headers(admin_token),
    )
    prov_id = r.json()["id"]

    r2 = await client.delete(
        f"/api/v1/providers/{prov_id}",
        headers=auth_headers(admin_token),
    )
    assert r2.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_provider(client, admin_token):
    r = await client.delete(
        "/api/v1/providers/99999",
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 404
