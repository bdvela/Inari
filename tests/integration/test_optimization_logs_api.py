"""
Tests de integración — GET /api/v1/admin/optimization-logs
"""
from datetime import datetime, timezone

import pytest
import pytest_asyncio

from backend.models.models import (
    Event, EventType, OptimizationLog, Provider, Quotation,
    QuotationLevel, QuotationStatus, Service, User, UserRole,
)
from backend.core.security import hash_password
from tests.integration.conftest import auth_headers, login_user, register_user

LIST_URL = "/api/v1/admin/optimization-logs"
DETAIL_URL = "/api/v1/admin/optimization-logs/{id}"

_ids: dict = {}


# ---------------------------------------------------------------------------
# Seed — logs de optimización con distintos algoritmos y fechas
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", autouse=True)
async def seeded_logs(session_factory):
    """Crea cotizaciones y logs de optimización para los tests."""
    async with session_factory() as session:
        admin = User(
            nombre="Admin Logs", email="admin_logs@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.ADMIN,
        )
        ejecutivo = User(
            nombre="Exec Logs", email="exec_logs@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.EJECUTIVO,
        )
        cliente = User(
            nombre="Cliente Logs", email="cliente_logs@test.com",
            hashed_password=hash_password("test1234"), role=UserRole.CLIENTE,
        )
        session.add_all([admin, ejecutivo, cliente])
        await session.flush()

        svc = Service(nombre="svc_logs", descripcion="test", tipo="catering")
        session.add(svc)
        await session.flush()

        prov = Provider(
            nombre="Prov Logs", servicio_id=svc.id,
            costo_base=2000.0, indice_calidad=0.75,
            puntuacion_historica=0.70, experiencia_en_tipo_evento=0.75,
            tipos_evento_compatibles=["boda"], fechas_no_disponibles=[], tier="basico",
        )
        session.add(prov)
        await session.flush()

        from datetime import date
        event = Event(
            cliente_id=cliente.id, tipo=EventType.BODA,
            fecha=date(2027, 3, 10), num_invitados=50,
            presupuesto_maximo=10000.0,
        )
        session.add(event)
        await session.flush()

        q1 = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=1,
            nivel=QuotationLevel.BASICO, estado=QuotationStatus.COMPLETADO,
            costo_total=2000.0, quality_score=0.75,
        )
        q2 = Quotation(
            cliente_id=cliente.id, evento_id=event.id, version=1,
            nivel=QuotationLevel.PREMIUM, estado=QuotationStatus.COMPLETADO,
            costo_total=4000.0, quality_score=0.88,
        )
        session.add_all([q1, q2])
        await session.flush()

        # Log ILP
        log_ilp = OptimizationLog(
            cotizacion_id=q1.id,
            input_json={"budget": 10000, "quality_weight": 1.0, "event_type": "boda"},
            output_json={"total_cost": 2000, "feasible": True, "algorithm_used": "ILP"},
            algoritmo_usado="ILP",
            duracion_ms=120,
            es_factible=True,
            created_at=datetime(2026, 3, 1, 10, 0, tzinfo=timezone.utc),
        )
        # Log GREEDY
        log_greedy = OptimizationLog(
            cotizacion_id=q2.id,
            input_json={"budget": 13000, "quality_weight": 1.3, "event_type": "boda"},
            output_json={"total_cost": 4000, "feasible": True, "algorithm_used": "GREEDY"},
            algoritmo_usado="GREEDY",
            duracion_ms=45,
            es_factible=True,
            created_at=datetime(2026, 3, 15, 14, 0, tzinfo=timezone.utc),
        )
        session.add_all([log_ilp, log_greedy])
        await session.flush()
        await session.commit()

        _ids["admin_email"] = "admin_logs@test.com"
        _ids["exec_email"] = "exec_logs@test.com"
        _ids["log_ilp_id"] = log_ilp.id
        _ids["log_greedy_id"] = log_greedy.id
        _ids["q1_id"] = q1.id


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_retorna_logs_paginados(client, seeded_logs):
    token = await login_user(client, email=_ids["admin_email"])
    r = await client.get(LIST_URL, headers=auth_headers(token))

    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert "total" in body
    assert "page" in body
    assert "pages" in body
    assert body["page"] == 1
    assert body["total"] >= 2


@pytest.mark.asyncio
async def test_filtro_por_algoritmo(client, seeded_logs):
    token = await login_user(client, email=_ids["admin_email"])

    r = await client.get(LIST_URL, params={"algoritmo": "ILP"}, headers=auth_headers(token))
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    assert all(i["algoritmo_usado"] == "ILP" for i in items)


@pytest.mark.asyncio
async def test_filtro_por_fecha_desde_y_hasta(client, seeded_logs):
    token = await login_user(client, email=_ids["admin_email"])

    # Solo logs desde el 10 de marzo 2026
    r = await client.get(
        LIST_URL,
        params={"fecha_desde": "2026-03-10T00:00:00", "fecha_hasta": "2026-03-20T00:00:00"},
        headers=auth_headers(token),
    )
    assert r.status_code == 200
    items = r.json()["items"]
    # Solo el GREEDY del 15 de marzo debe aparecer (no el del 1 de marzo)
    assert len(items) >= 1
    assert all(i["algoritmo_usado"] == "GREEDY" for i in items if i["id"] in (
        _ids["log_greedy_id"], _ids["log_ilp_id"]
    ))


@pytest.mark.asyncio
async def test_filtro_por_cotizacion_id(client, seeded_logs):
    token = await login_user(client, email=_ids["admin_email"])

    r = await client.get(
        LIST_URL,
        params={"cotizacion_id": _ids["q1_id"]},
        headers=auth_headers(token),
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    assert all(i["cotizacion_id"] == _ids["q1_id"] for i in items)


@pytest.mark.asyncio
async def test_detalle_retorna_input_output_completos(client, seeded_logs):
    token = await login_user(client, email=_ids["admin_email"])
    log_id = _ids["log_ilp_id"]

    r = await client.get(DETAIL_URL.format(id=log_id), headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()

    assert body["id"] == log_id
    assert "input_json" in body
    assert "output_json" in body
    assert body["input_json"]["event_type"] == "boda"
    assert body["output_json"]["feasible"] is True


@pytest.mark.asyncio
async def test_detalle_404_log_inexistente(client, seeded_logs):
    token = await login_user(client, email=_ids["admin_email"])
    r = await client.get(DETAIL_URL.format(id=999999), headers=auth_headers(token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_logs_son_inmutables_delete_retorna_405(client, seeded_logs):
    """Los logs no deben poder eliminarse ni modificarse."""
    token = await login_user(client, email=_ids["admin_email"])
    log_id = _ids["log_ilp_id"]

    r_del  = await client.delete(DETAIL_URL.format(id=log_id), headers=auth_headers(token))
    r_patch = await client.patch(DETAIL_URL.format(id=log_id), json={}, headers=auth_headers(token))
    r_put  = await client.put(DETAIL_URL.format(id=log_id), json={}, headers=auth_headers(token))

    assert r_del.status_code == 405
    assert r_patch.status_code == 405
    assert r_put.status_code == 405


@pytest.mark.asyncio
async def test_ejecutivo_retorna_403(client, seeded_logs):
    token = await login_user(client, email=_ids["exec_email"])
    r = await client.get(LIST_URL, headers=auth_headers(token))
    assert r.status_code == 403
