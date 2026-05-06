"""
Análisis de imágenes de referencia de estilo.
Analiza 1-3 imágenes como inspiración estética — no como foto de evento completo.
Retorna StyleAnalysisResult con confidence=0 si falla — nunca lanza excepción.
"""
import asyncio
import json
import re
from functools import partial
from pathlib import Path

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.logging import get_logger
from backend.modules.visual_analysis.prompts import STYLE_ANALYSIS_SYSTEM_PROMPT
from backend.modules.visual_analysis.schemas import StyleAnalysisResult

logger = get_logger("visual_analysis.style_analysis")
settings = get_settings()

ALLOWED_MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024
MAX_IMAGES = 3


def _call_gemini_style_sync(images_with_mime: list[tuple[bytes, str]]) -> str:
    """Llamada síncrona a Gemini con múltiples imágenes. Ejecutar en thread pool."""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    parts = [
        types.Part.from_bytes(data=img_bytes, mime_type=mime)
        for img_bytes, mime in images_with_mime
    ]
    parts.append(types.Part.from_text(text=STYLE_ANALYSIS_SYSTEM_PROMPT))

    response = client.models.generate_content(
        model=settings.VISION_MODEL,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=1024),
    )
    return response.text


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No JSON en respuesta: {raw[:200]}")


async def analyze_style_references(
    images: list[tuple[bytes, str]],  # [(bytes, filename), ...]
) -> StyleAnalysisResult:
    """
    Analiza 1-3 imágenes de referencia de estilo.
    Retorna StyleAnalysisResult con confidence=0 si falla.
    """
    if not settings.GEMINI_API_KEY or not images:
        return StyleAnalysisResult()

    # Filtrar y validar imágenes
    valid: list[tuple[bytes, str]] = []
    for img_bytes, filename in images[:MAX_IMAGES]:
        suffix = Path(filename).suffix.lower()
        mime = ALLOWED_MIME.get(suffix)
        if not mime:
            logger.debug("Formato no soportado para análisis de estilo: %s", filename)
            continue
        if len(img_bytes) > MAX_SIZE_BYTES:
            logger.debug("Imagen demasiado grande para análisis de estilo: %s", filename)
            continue
        valid.append((img_bytes, mime))

    if not valid:
        return StyleAnalysisResult()

    try:
        loop = asyncio.get_event_loop()
        raw_text = await loop.run_in_executor(
            None, partial(_call_gemini_style_sync, valid)
        )
    except Exception as exc:
        logger.error("Error en análisis de estilo con Gemini: %s", exc)
        return StyleAnalysisResult()

    try:
        parsed = _extract_json(raw_text)
        luxury = max(1, min(5, int(parsed.get("luxury_level", 3))))
        return StyleAnalysisResult(
            dominant_colors=parsed.get("dominant_colors", []),
            aesthetic_style=parsed.get("aesthetic_style", "otro"),
            luxury_level=luxury,
            style_keywords=parsed.get("style_keywords", []),
            confidence=float(parsed.get("confidence", 0.5)),
        )
    except Exception as exc:
        logger.error("Error parseando respuesta de análisis de estilo: %s", exc)
        return StyleAnalysisResult()
