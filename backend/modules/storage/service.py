"""
StorageService — abstracción de almacenamiento de imágenes.

Dev: guarda en disco local (storage/uploads/).
Prod: swap a S3 o Supabase implementando la misma interfaz.

Decisión de diseño (ADR): encapsular storage aquí permite cambiar de
proveedor sin tocar ningún endpoint ni módulo de negocio.
"""
import hashlib
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path

from backend.core.config import get_settings
from backend.core.logging import get_logger
from backend.modules.storage.exceptions import FileTooLargeError, InvalidFileTypeError, StorageError

logger = get_logger("storage")
settings = get_settings()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Directorio base de uploads — relativo a la raíz del proyecto
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "storage" / "uploads"


class StorageService:
    """
    Servicio de almacenamiento local.
    Interfaz compatible con futura implementación cloud.
    """

    def __init__(self) -> None:
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    def _validate(self, filename: str, size: int) -> str:
        """Valida tipo y tamaño. Retorna extensión normalizada."""
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise InvalidFileTypeError(
                f"Tipo no permitido: {suffix}. Usa JPG, PNG o WEBP."
            )
        if size > MAX_SIZE_BYTES:
            mb = size / (1024 * 1024)
            raise FileTooLargeError(f"Archivo demasiado grande: {mb:.1f} MB. Máximo 10 MB.")
        return suffix

    def _generate_key(self, suffix: str) -> str:
        """Genera key único basado en UUID + timestamp."""
        uid = uuid.uuid4().hex
        ts = datetime.now(timezone.utc).strftime("%Y%m%d")
        return f"{ts}/{uid}{suffix}"

    async def save(self, file_bytes: bytes, original_filename: str) -> tuple[str, str]:
        """
        Guarda archivo en disco.
        Retorna (storage_key, public_url).

        storage_key: ruta relativa para recuperar el archivo.
        public_url:  URL para acceso desde el frontend.
        """
        suffix = self._validate(original_filename, len(file_bytes))
        key = self._generate_key(suffix)
        dest = UPLOADS_DIR / key

        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(file_bytes)

        logger.info("Imagen guardada: %s (%d bytes)", key, len(file_bytes))

        public_url = f"{settings.STORAGE_BASE_URL}/api/v1/images/{key}"
        return key, public_url

    async def get_bytes(self, key: str) -> bytes:
        """Lee archivo del disco por su storage_key."""
        path = UPLOADS_DIR / key
        if not path.exists():
            raise StorageError(f"Archivo no encontrado: {key}")
        return path.read_bytes()

    async def delete(self, key: str) -> None:
        """Elimina archivo. No lanza error si no existe."""
        path = UPLOADS_DIR / key
        if path.exists():
            path.unlink()
            logger.info("Imagen eliminada: %s", key)

    def get_content_type(self, key: str) -> str:
        """Infiere Content-Type desde extensión."""
        suffix = Path(key).suffix.lower()
        return {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }.get(suffix, "application/octet-stream")


# Singleton — una instancia para toda la app
_storage: StorageService | None = None


def get_storage() -> StorageService:
    global _storage
    if _storage is None:
        _storage = StorageService()
    return _storage
