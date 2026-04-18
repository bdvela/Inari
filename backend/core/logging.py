"""
Configuración de logging para todo el sistema.
Usar siempre este logger, nunca print().
"""
import logging
import sys
from backend.core.config import get_settings


def setup_logging() -> logging.Logger:
    settings = get_settings()
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    return logging.getLogger("inari")


def get_logger(name: str) -> logging.Logger:
    """Obtener logger hijo con nombre de módulo."""
    return logging.getLogger(f"inari.{name}")
