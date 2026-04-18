"""
Cliente de análisis visual con Google Gemini.
Único punto de contacto con la API de Gemini — nunca llamar directamente desde endpoints.
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
from backend.modules.visual_analysis.exceptions import ImageValidationError, LLMAPIError, VisualAnalysisError
from backend.modules.visual_analysis.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from backend.modules.visual_analysis.schemas import VisualAnalysisResult

logger = get_logger("visual_analysis")
settings = get_settings()

ALLOWED_MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _validate_image(image_bytes: bytes, filename: str) -> str:
    """Valida formato y tamaño. Retorna mime_type."""
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_MIME_TYPES:
        raise ImageValidationError(
            f"Formato no soportado: {suffix}. Usa JPG, PNG o WEBP."
        )
    if len(image_bytes) > MAX_SIZE_BYTES:
        mb = len(image_bytes) / (1024 * 1024)
        raise ImageValidationError(f"Imagen demasiado grande: {mb:.1f} MB. Máximo 10 MB.")
    return ALLOWED_MIME_TYPES[suffix]


def _parse_llm_response(raw: str) -> dict:
    """Extrae JSON de la respuesta del LLM. Robusto ante texto extra."""
    try:
        return json.loads(raw.strip())
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

    raise VisualAnalysisError(f"No se pudo parsear respuesta JSON del LLM: {raw[:200]}")


def _call_gemini_sync(image_bytes: bytes, mime_type: str) -> str:
    """
    Llamada síncrona a Gemini. Se ejecuta en thread pool para no bloquear el event loop.
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    full_prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE}"

    response = client.models.generate_content(
        model=settings.VISION_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    types.Part.from_text(text=full_prompt),
                ],
            )
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=1024,
        ),
    )
    return response.text


async def analyze_image(image_bytes: bytes, filename: str) -> VisualAnalysisResult:
    """
    Analiza imagen usando Google Gemini con capacidades de visión.
    Lanza VisualAnalysisError si la imagen no es procesable o la API falla.
    """
    if not settings.GEMINI_API_KEY:
        raise LLMAPIError("GEMINI_API_KEY no configurada", cause=None)

    mime_type = _validate_image(image_bytes, filename)

    try:
        logger.info("Enviando imagen a Gemini Vision: %s (%d bytes)", filename, len(image_bytes))

        # Ejecutar llamada síncrona en thread pool para no bloquear el event loop
        loop = asyncio.get_event_loop()
        raw_text = await loop.run_in_executor(
            None, partial(_call_gemini_sync, image_bytes, mime_type)
        )

    except Exception as exc:
        logger.error("Error en Gemini API: %s", exc)
        raise LLMAPIError(f"Error al llamar a Gemini API: {exc}", cause=exc) from exc

    logger.debug("Respuesta Gemini: %s", raw_text[:300])
    parsed = _parse_llm_response(raw_text)

    return VisualAnalysisResult(
        event_type=parsed.get("event_type", "otro"),
        style=parsed.get("style", "otro"),
        inferred_services=parsed.get("inferred_services", []),
        visual_elements=parsed.get("visual_elements", []),
        confidence=float(parsed.get("confidence", 0.5)),
        raw_response=raw_text,
    )
