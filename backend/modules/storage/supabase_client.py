"""
Cliente de Supabase Storage para producción.
Activo cuando STORAGE_BACKEND=supabase en variables de entorno.
"""
from supabase import create_client, Client

from backend.core.config import get_settings


def get_supabase_client() -> Client:
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL y SUPABASE_KEY requeridos cuando STORAGE_BACKEND=supabase"
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
