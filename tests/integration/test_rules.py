"""
Tests de integración — CRUD de reglas de negocio (RF-11).
Verifica control de acceso por rol y operaciones CRUD.
"""
import pytest
import pytest_asyncio

from backend.models.models import Service
from tests.integration.conftest import register_user, login_user, auth_headers

# ---------------------------------------------------------------------------
# Fixture: sembrar un servicio para usarlo en las reglas
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module")
async def rules_service(session_factory):
    """Crea un servicio en BD para usarlo como FK en las reglas de prueba."""
    async with session_factory() as session:
        svc = Service(nombre="rules_test_svc", descripcion="Servicio para tests de reglas", tipo="catering")
        session.add(svc)
        await session.commit()
        await session.refresh(svc)
        return svc.id


# ---------------------------------------------------------------------------
# Fixtures de tokens por rol
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def admin_token(client):
    await register_user(client, email="admin_rules@test.com", nombre="Admin Rules", role="admin")
    return await login_user(client, email="admin_rules@test.com")


@pytest_asyncio.fixture
async def ejecutivo_token(client):
    await register_user(client, email="ejec_rules@test.com", nombre="Ejec Rules", role="ejecutivo")
    return await login_user(client, email="ejec_rules@test.com")


@pytest_asyncio.fixture
async def cliente_token(client):
    await register_user(client, email="cli_rules@test.com", nombre="Cliente Rules", role="cliente")
    return await login_user(client, email="cli_rules@test.com")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def rule_payload(servicio_id: int, tipo_evento: str = "conferencia") -> dict:
    return {
        "tipo_evento": tipo_evento,
        "servicio_id": servicio_id,
        "es_obligatorio": True,
        "condicion": None,
        "descripcion": "Regla de prueba",
    }


# ---------------------------------------------------------------------------
# GET /rules/ — lectura
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_rules_ejecutivo(client, ejecutivo_token):
    """Ejecutivo puede listar reglas."""
    r = await client.get("/api/v1/rules/", headers=auth_headers(ejecutivo_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_list_rules_admin(client, admin_token):
    """Admin puede listar reglas."""
    r = await client.get("/api/v1/rules/", headers=auth_headers(admin_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_list_rules_cliente_forbidden(client, cliente_token):
    """Cliente no puede ver reglas."""
    r = await client.get("/api/v1/rules/", headers=auth_headers(cliente_token))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_list_event_types_ejecutivo(client, ejecutivo_token):
    """Ejecutivo puede listar tipos de evento."""
    r = await client.get("/api/v1/rules/event-types/", headers=auth_headers(ejecutivo_token))
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) > 0
    assert any(item["value"] == "boda" for item in items)


@pytest.mark.asyncio
async def test_list_services_ejecutivo(client, ejecutivo_token, rules_service):
    """Ejecutivo puede listar servicios disponibles."""
    r = await client.get("/api/v1/rules/services/", headers=auth_headers(ejecutivo_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------------------------------------------------------------------------
# POST /rules/ — creación
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_rule_admin(client, admin_token, rules_service):
    """Admin puede crear regla."""
    r = await client.post(
        "/api/v1/rules/",
        json=rule_payload(rules_service, tipo_evento="conferencia"),
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["id"] > 0
    assert body["tipo_evento"] == "conferencia"
    assert body["es_obligatorio"] is True


@pytest.mark.asyncio
async def test_create_rule_ejecutivo_forbidden(client, ejecutivo_token, rules_service):
    """Ejecutivo no puede crear regla."""
    r = await client.post(
        "/api/v1/rules/",
        json=rule_payload(rules_service, tipo_evento="otro"),
        headers=auth_headers(ejecutivo_token),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_create_duplicate_rule_rejected(client, admin_token, rules_service):
    """(tipo_evento, servicio_id) único — duplicado → 409."""
    payload = rule_payload(rules_service, tipo_evento="quinceanos")
    # Primera creación
    r1 = await client.post("/api/v1/rules/", json=payload, headers=auth_headers(admin_token))
    assert r1.status_code == 201

    # Duplicado
    r2 = await client.post("/api/v1/rules/", json=payload, headers=auth_headers(admin_token))
    assert r2.status_code == 409


# ---------------------------------------------------------------------------
# PUT /rules/{id} — actualización
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_rule_admin(client, admin_token, rules_service):
    """Admin puede actualizar regla existente."""
    r = await client.post(
        "/api/v1/rules/",
        json=rule_payload(rules_service, tipo_evento="cumpleanos"),
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 201
    rule_id = r.json()["id"]

    r2 = await client.put(
        f"/api/v1/rules/{rule_id}",
        json={"es_obligatorio": False, "descripcion": "Actualizada"},
        headers=auth_headers(admin_token),
    )
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert body["es_obligatorio"] is False
    assert body["descripcion"] == "Actualizada"


@pytest.mark.asyncio
async def test_update_nonexistent_rule(client, admin_token):
    """Regla no encontrada → 404."""
    r = await client.put(
        "/api/v1/rules/99999",
        json={"es_obligatorio": False},
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /rules/{id} — eliminación
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_rule_admin(client, admin_token, rules_service):
    """Admin puede eliminar regla."""
    r = await client.post(
        "/api/v1/rules/",
        json=rule_payload(rules_service, tipo_evento="corporativo"),
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 201
    rule_id = r.json()["id"]

    r2 = await client.delete(f"/api/v1/rules/{rule_id}", headers=auth_headers(admin_token))
    assert r2.status_code == 204

    # Verificar que ya no existe
    r3 = await client.delete(f"/api/v1/rules/{rule_id}", headers=auth_headers(admin_token))
    assert r3.status_code == 404


@pytest.mark.asyncio
async def test_delete_rule_ejecutivo_forbidden(client, ejecutivo_token, admin_token, rules_service):
    """Ejecutivo no puede eliminar regla."""
    r = await client.post(
        "/api/v1/rules/",
        json=rule_payload(rules_service, tipo_evento="boda"),
        headers=auth_headers(admin_token),
    )
    assert r.status_code == 201
    rule_id = r.json()["id"]

    r2 = await client.delete(f"/api/v1/rules/{rule_id}", headers=auth_headers(ejecutivo_token))
    assert r2.status_code == 403
