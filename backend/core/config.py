"""
Configuración central del sistema.
Cargada desde variables de entorno vía pydantic-settings.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Base de datos
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/eventos_db"

    # Anthropic (legacy — ya no se usa)
    ANTHROPIC_API_KEY: str = ""

    # Google Gemini (análisis visual)
    GEMINI_API_KEY: str = ""

    # Almacenamiento
    STORAGE_BUCKET: str = "eventos-referencias"
    STORAGE_BASE_URL: str = "http://localhost:8000"
    # "local" = disco local dev | "s3" | "supabase"
    STORAGE_BACKEND: str = "local"

    # Seguridad
    SECRET_KEY: str = "cambiar-en-produccion"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 horas

    # Optimizador — pesos del índice de calidad (deben sumar 1.0)
    QUALITY_WEIGHT_HISTORICAL: float = 0.5
    QUALITY_WEIGHT_PRICE: float = 0.3
    QUALITY_WEIGHT_EXPERIENCE: float = 0.2

    # ILP: umbral de combinaciones para cambiar de ILP a Greedy
    OPTIMIZER_ILP_MAX_COMBINATIONS: int = 500

    # Gemini vision model — usar nombre completo del SDK
    VISION_MODEL: str = "gemini-2.5-flash-lite"

    # Porcentaje de presupuesto adicional para cotización premium
    PREMIUM_BUDGET_MULTIPLIER: float = 1.30

    # App
    APP_NAME: str = "Sistema Inteligente de Propuestas de Eventos"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
