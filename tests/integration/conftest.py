"""
Fixtures de integración — BD SQLite en memoria + cliente HTTP.

Estrategia:
- SQLite+aiosqlite en memoria con StaticPool: mismo conexión compartida.
- Engine session-scoped: un DB por sesión de tests.
- Tablas limpias al inicio de la sesión.
- Cada test usa sesión independiente; emails únicos evitan colisiones.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from backend.core.database import Base, get_db
from backend.main import app

# Fuerza carga de todos los modelos en metadata antes de create_all
from backend.models import models  # noqa: F401

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture(scope="session")
def session_factory(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session(session_factory):
    """Sesión por test. No hace rollback automático — tests usan datos únicos."""
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    """Cliente HTTP con BD de prueba inyectada."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def register_user(
    client: AsyncClient,
    *,
    email: str,
    password: str = "test1234",
    nombre: str = "Test User",
    role: str = "cliente",
) -> dict:
    r = await client.post("/api/v1/auth/register", json={
        "nombre": nombre,
        "email": email,
        "password": password,
        "role": role,
    })
    assert r.status_code == 201, r.text
    return r.json()


async def login_user(client: AsyncClient, *, email: str, password: str = "test1234") -> str:
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
