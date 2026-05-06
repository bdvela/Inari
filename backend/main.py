"""
Punto de entrada de la aplicación FastAPI.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routers import auth, images, packages, providers, quotations, rules
from backend.core.config import get_settings
from backend.core.database import create_tables
from backend.core.logging import setup_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # En desarrollo, crear tablas automáticamente
    if settings.DEBUG:
        await create_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema Inteligente de Propuestas de Eventos — API REST",
    lifespan=lifespan,
)

_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(quotations.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(rules.router, prefix="/api/v1")
app.include_router(packages.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
