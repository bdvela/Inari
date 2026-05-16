"""
Tests de regresión — autenticación JWT.

Cubren contratos de seguridad críticos:
- Estructura del JWT emitido (sub, exp)
- Mensajes de error 401 indistinguibles (no filtrar email existente)
- Role válido en respuesta
- Acceso denegado sin token (401/403) y con rol insuficiente (403)
- Token expirado rechazado (401)

Ejecutar: pytest tests/integration/test_auth_regression.py -v
"""
from datetime import timedelta

import pytest
from jose import jwt

from backend.core.config import get_settings
from backend.core.security import ALGORITHM, create_access_token
from tests.integration.conftest import auth_headers, register_user

settings = get_settings()

VALID_ROLES = {"cliente", "ejecutivo", "admin"}


# ---------------------------------------------------------------------------
# 1. Login válido → JWT contiene sub y exp; sub == user_id
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_jwt_contains_sub_and_exp(client):
    await register_user(client, email="jwt_fields_reg@test.com", password="pass1234")
    r = await client.post("/api/v1/auth/login", json={
        "email": "jwt_fields_reg@test.com",
        "password": "pass1234",
    })
    assert r.status_code == 200
    body = r.json()

    payload = jwt.decode(body["access_token"], settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert "sub" in payload, "JWT debe contener claim 'sub'"
    assert "exp" in payload, "JWT debe contener claim 'exp'"
    assert int(payload["sub"]) == body["user_id"], "sub debe coincidir con user_id"


# ---------------------------------------------------------------------------
# 2. Password incorrecto → 401 con mensaje genérico
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_wrong_password_returns_401_generic(client):
    await register_user(client, email="wrongpw_reg@test.com", password="correct")
    r = await client.post("/api/v1/auth/login", json={
        "email": "wrongpw_reg@test.com",
        "password": "WRONG_PASSWORD",
    })
    assert r.status_code == 401
    assert r.json()["detail"] == "Credenciales incorrectas"


# ---------------------------------------------------------------------------
# 3. Email inexistente → 401 con MISMO mensaje (no filtrar si email existe)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_unknown_email_same_message_as_wrong_password(client):
    r_unknown = await client.post("/api/v1/auth/login", json={
        "email": "ghost_regression@nowhere.com",
        "password": "whatever",
    })
    assert r_unknown.status_code == 401

    # Registro un usuario real y fallo password para comparar mensaje
    await register_user(client, email="real_msg_reg@test.com", password="correct")
    r_wrong = await client.post("/api/v1/auth/login", json={
        "email": "real_msg_reg@test.com",
        "password": "WRONG",
    })
    assert r_wrong.status_code == 401

    # Ambos errores deben devolver el mismo mensaje (no revelar si email existe)
    assert r_unknown.json()["detail"] == r_wrong.json()["detail"], (
        "Mensajes de error deben ser idénticos para no filtrar existencia de email"
    )


# ---------------------------------------------------------------------------
# 4. Role en response body ∈ {cliente, ejecutivo, admin}
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@pytest.mark.parametrize("role", ["cliente", "ejecutivo", "admin"])
async def test_login_response_role_in_valid_set(client, role):
    email = f"role_{role}_reg@test.com"
    await register_user(client, email=email, role=role)
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": "test1234"})
    assert r.status_code == 200
    returned_role = r.json()["role"]
    assert returned_role in VALID_ROLES, f"role '{returned_role}' no está en {VALID_ROLES}"
    assert returned_role == role


# ---------------------------------------------------------------------------
# 5. Endpoint protegido sin token → 401 o 403
#    (FastAPI HTTPBearer devuelve 403 cuando no hay header Authorization)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_protected_endpoint_no_token_denied(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code in (401, 403), (
        f"Sin token esperado 401 o 403, obtuvo {r.status_code}"
    )


# ---------------------------------------------------------------------------
# 6. Endpoint protegido con rol insuficiente → 403
#    CLIENTE intenta GET /providers/ que requiere EJECUTIVO o ADMIN
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_protected_endpoint_insufficient_role_returns_403(client):
    data = await register_user(client, email="cliente_403_reg@test.com", role="cliente")
    r = await client.get(
        "/api/v1/providers/",
        headers=auth_headers(data["access_token"]),
    )
    assert r.status_code == 403, (
        f"CLIENTE en endpoint EJECUTIVO/ADMIN debe retornar 403, obtuvo {r.status_code}"
    )


# ---------------------------------------------------------------------------
# 7. Token con exp vencido → 401
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_expired_token_returns_401(client):
    expired_token = create_access_token(
        {"sub": "99999"},
        expires_delta=timedelta(seconds=-1),
    )
    r = await client.get("/api/v1/auth/me", headers=auth_headers(expired_token))
    assert r.status_code == 401, (
        f"Token expirado debe retornar 401, obtuvo {r.status_code}"
    )
