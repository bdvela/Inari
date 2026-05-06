"""
Tests de integración — endpoints de autenticación.
Cubre: registro, login, token inválido, email duplicado.
"""
import pytest

from tests.integration.conftest import register_user, auth_headers


@pytest.mark.asyncio
async def test_register_success(client):
    data = await register_user(client, email="nuevo@test.com", nombre="Nuevo Usuario")
    assert data["access_token"]
    assert data["role"] == "cliente"
    assert data["user_id"] > 0


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await register_user(client, email="dup@test.com")
    r = await client.post("/api/v1/auth/register", json={
        "nombre": "Otro",
        "email": "dup@test.com",
        "password": "test1234",
    })
    assert r.status_code == 400
    assert "registrado" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client):
    await register_user(client, email="login@test.com", password="mypass99")
    r = await client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "mypass99",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await register_user(client, email="wrongpass@test.com")
    r = await client.post("/api/v1/auth/login", json={
        "email": "wrongpass@test.com",
        "password": "WRONG",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    r = await client.post("/api/v1/auth/login", json={
        "email": "ghost@nowhere.com",
        "password": "whatever",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_no_token(client):
    r = await client.get("/api/v1/quotations/")
    # FastAPI HTTPBearer devuelve 403 cuando no hay token (no 401)
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_protected_route_invalid_token(client):
    r = await client.get("/api/v1/quotations/", headers={"Authorization": "Bearer fake.token.here"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_register_admin_role(client):
    data = await register_user(
        client, email="admin@test.com", nombre="Admin", role="admin"
    )
    assert data["role"] == "admin"
