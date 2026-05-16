"""
Tests unitarios — backend/modules/assistant/chat_orchestrator.py

Estrategia:
- SQLite en memoria para persistencia (sin red, sin PostgreSQL).
- parse_description mockeado — no llama Gemini.
- Verifica contratos del orquestador: acumulación de parámetros,
  detección de campos faltantes, confirmación y expiración.
"""
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from backend.core.database import Base
from backend.models import models  # noqa: F401 — registra modelos en metadata
import backend.models.chat_session  # noqa: F401 — registra ChatSession en metadata
from backend.modules.assistant.chat_orchestrator import (
    INITIAL_MESSAGE,
    REQUIRED_FIELDS,
    confirm_session,
    expire_sessions,
    process_message,
    start_session,
)
from backend.modules.visual_analysis.schemas import ParsedDescription

# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="module")
async def engine():
    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture(scope="module")
def session_factory(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db(session_factory):
    async with session_factory() as session:
        yield session


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _parsed(**kwargs) -> ParsedDescription:
    """Construye ParsedDescription de prueba con parseable=True."""
    defaults = dict(parseable=True, confidence=0.9)
    return ParsedDescription(**(defaults | kwargs))


def _empty_parsed() -> ParsedDescription:
    return ParsedDescription(parseable=False, message="Sin datos")


# ─── Tests ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_start_session_crea_registro_y_devuelve_mensaje_inicial(db):
    session = await start_session(user_id=1, db=db)

    assert session.id is not None
    assert session.user_id == 1
    assert session.is_confirmed is False
    assert len(session.messages) == 1
    msg = session.messages[0]
    assert msg["role"] == "assistant"
    assert INITIAL_MESSAGE in msg["content"]


@pytest.mark.asyncio
async def test_process_message_extrae_tipo_evento_y_num_invitados(db):
    session = await start_session(user_id=2, db=db)

    mock_result = _parsed(event_type="boda", guest_count=120)

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=mock_result),
    ):
        result = await process_message(session.id, "boda para 120 personas", db)

    assert result["extracted_params"]["tipo_evento"] == "boda"
    assert result["extracted_params"]["num_invitados"] == 120


@pytest.mark.asyncio
async def test_missing_fields_incluye_fecha_y_presupuesto_cuando_faltan(db):
    session = await start_session(user_id=3, db=db)

    mock_result = _parsed(event_type="boda", guest_count=120)

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=mock_result),
    ):
        result = await process_message(session.id, "boda para 120 personas", db)

    assert "fecha" in result["missing_fields"]
    assert "presupuesto" in result["missing_fields"]
    assert result["is_complete"] is False


@pytest.mark.asyncio
async def test_segundo_mensaje_completa_campos_faltantes(db):
    session = await start_session(user_id=4, db=db)

    first = _parsed(event_type="boda", guest_count=120)
    second = _parsed(
        event_type="boda",
        guest_count=120,
        approximate_date="2026-09-15",
        max_budget=35000.0,
    )

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=first),
    ):
        await process_message(session.id, "boda para 120 personas", db)

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=second),
    ):
        result = await process_message(session.id, "el 15 de septiembre con presupuesto 35000", db)

    assert result["extracted_params"]["fecha"] == "2026-09-15"
    assert result["extracted_params"]["presupuesto"] == 35000.0
    assert result["missing_fields"] == []


@pytest.mark.asyncio
async def test_is_complete_true_cuando_cuatro_required_presentes(db):
    session = await start_session(user_id=5, db=db)

    full = _parsed(
        event_type="corporativo",
        guest_count=50,
        approximate_date="2026-11-20",
        max_budget=20000.0,
    )

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=full),
    ):
        result = await process_message(session.id, "evento completo", db)

    assert result["is_complete"] is True
    assert result["missing_fields"] == []
    # El mensaje de respuesta pide confirmación
    assert "confirm" in result["assistant_message"].lower() or "confirmas" in result["assistant_message"].lower()


@pytest.mark.asyncio
async def test_correccion_actualiza_num_invitados(db):
    """'ah, son 100 invitados no 120' — num_invitados se actualiza a 100."""
    session = await start_session(user_id=6, db=db)

    first = _parsed(event_type="boda", guest_count=120)
    correction = _parsed(
        event_type="boda",
        guest_count=100,
        approximate_date="2026-06-10",
        max_budget=28000.0,
    )

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=first),
    ):
        await process_message(session.id, "boda para 120 personas", db)

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=correction),
    ):
        result = await process_message(session.id, "ah, son 100 invitados no 120", db)

    assert result["extracted_params"]["num_invitados"] == 100


@pytest.mark.asyncio
async def test_confirm_session_antes_de_is_complete_lanza_value_error(db):
    """confirm_session con campos faltantes debe lanzar ValueError."""
    session = await start_session(user_id=7, db=db)

    # Solo tipo_evento — faltan 3 campos
    partial_result = _parsed(event_type="cumpleanos")

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=partial_result),
    ):
        await process_message(session.id, "cumpleaños", db)

    with pytest.raises(ValueError, match="faltan campos"):
        await confirm_session(session.id, db)


@pytest.mark.asyncio
async def test_confirm_session_con_campos_completos_marca_confirmada(db):
    session = await start_session(user_id=8, db=db)

    full = _parsed(
        event_type="boda",
        guest_count=80,
        approximate_date="2026-12-01",
        max_budget=40000.0,
    )

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=full),
    ):
        await process_message(session.id, "boda completa", db)

    confirmed = await confirm_session(session.id, db)

    assert confirmed.is_confirmed is True


@pytest.mark.asyncio
async def test_none_no_sobreescribe_campo_existente(db):
    """Si parse devuelve None para un campo ya guardado, el valor se conserva."""
    session = await start_session(user_id=9, db=db)

    first = _parsed(event_type="boda", guest_count=80)
    second = _parsed(event_type="boda", guest_count=None)  # guest_count ausente

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=first),
    ):
        await process_message(session.id, "boda para 80", db)

    with patch(
        "backend.modules.assistant.chat_orchestrator.parse_description",
        new=AsyncMock(return_value=second),
    ):
        result = await process_message(session.id, "menciono estilo rústico", db)

    # num_invitados no debe haber sido borrado
    assert result["extracted_params"]["num_invitados"] == 80
