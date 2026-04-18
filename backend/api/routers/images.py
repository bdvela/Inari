"""
Endpoint para servir imágenes guardadas en storage local.
En producción con S3/Supabase, esto no se usa — el cliente accede
directamente a la URL firmada del bucket.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from backend.modules.storage import StorageError, get_storage

router = APIRouter(prefix="/images", tags=["Imágenes"])


@router.get("/{date_key}/{filename}")
async def serve_image(date_key: str, filename: str) -> Response:
    """
    Sirve imagen guardada localmente.
    Ruta: /api/v1/images/{YYYYMMDD}/{uuid}.{ext}
    """
    key = f"{date_key}/{filename}"
    storage = get_storage()

    try:
        image_bytes = await storage.get_bytes(key)
    except StorageError:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    content_type = storage.get_content_type(key)
    return Response(
        content=image_bytes,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400",  # 24h cache
            "Content-Length": str(len(image_bytes)),
        },
    )
