"""
Conftest raíz — configuración compartida para todos los tests.

Los tests unitarios del optimizer y rules_engine NO necesitan BD.
Los tests de integración (tests/integration/) usan SQLite en memoria.
"""
import sys
from pathlib import Path

import pytest

# Asegurar que el root del proyecto esté en sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
