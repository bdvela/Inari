"""
Parser de lenguaje natural para descripciones de eventos.
Usa Gemini para extraer parámetros estructurados de texto libre del cliente.
Nunca lanza excepción — siempre retorna ParsedDescription.
"""
import asyncio
import json
import re
from functools import partial

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.logging import get_logger
from backend.modules.visual_analysis.prompts import TEXT_PARSER_SYSTEM_PROMPT
from backend.modules.visual_analysis.schemas import ParsedDescription
from backend.models.models import EventType

logger = get_logger("visual_analysis.text_parser")
settings = get_settings()

_MIN_DESCRIPTION_LEN = 10


def _call_gemini_text_sync(description: str) -> str:
    """Llamada síncrona a Gemini con solo texto. Ejecutar en thread pool."""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    prompt = f"{TEXT_PARSER_SYSTEM_PROMPT}\n\nDescripción del cliente:\n{description}"
    response = client.models.generate_content(
        model=settings.VISION_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            )
        ],
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


def normalize_event_type(raw: str | None) -> EventType:
    """Mapea string libre de Gemini al enum EventType. Desconocido → OTRO."""
    if raw is None:
        return EventType.OTRO
    try:
        return EventType(raw.lower())
    except ValueError:
        return EventType.OTRO


async def parse_description(description: str) -> ParsedDescription:
    """
    Extrae campos de evento desde descripción libre.
    Retorna ParsedDescription con parseable=False si falla o descripción muy vaga.
    """
    if not settings.GEMINI_API_KEY:
        return ParsedDescription(
            parseable=False,
            message="El servicio de análisis no está disponible. Completa el formulario manualmente.",
        )

    if len(description.strip()) < _MIN_DESCRIPTION_LEN:
        return ParsedDescription(
            parseable=False,
            message="Por favor cuéntanos más sobre tu evento para poder ayudarte.",
        )

    try:
        loop = asyncio.get_event_loop()
        raw_text = await loop.run_in_executor(
            None, partial(_call_gemini_text_sync, description)
        )
    except Exception as exc:
        logger.error("Error en Gemini text parser: %s", exc)
        return ParsedDescription(
            parseable=False,
            message="No pudimos analizar tu descripción. Puedes completar el formulario manualmente.",
        )

    try:
        parsed = _extract_json(raw_text)
    except Exception as exc:
        logger.warning("Error parseando JSON de text parser: %s", exc)
        return ParsedDescription(
            parseable=False,
            message="No pude entender bien la descripción. Puedes completar el formulario directamente.",
        )

    confidence = float(parsed.get("confidence", 0.0))

    if confidence < 0.25:
        return ParsedDescription(
            parseable=False,
            message=parsed.get(
                "message",
                "La descripción es muy vaga. Agrega detalles como tipo de evento, número de invitados y presupuesto.",
            ),
        )

    # Normalizar guest_count
    guest_count = parsed.get("guest_count")
    if isinstance(guest_count, float):
        guest_count = int(guest_count)

    # Normalizar max_budget
    max_budget = parsed.get("max_budget")
    if max_budget is not None:
        try:
            max_budget = float(max_budget)
        except (TypeError, ValueError):
            max_budget = None

    # Normalizar event_type al enum del sistema — valores desconocidos → "otro"
    event_type = normalize_event_type(parsed.get("event_type")).value

    return ParsedDescription(
        parseable=True,
        event_type=event_type,
        guest_count=guest_count,
        approximate_date=parsed.get("approximate_date"),
        max_budget=max_budget,
        style_hints=parsed.get("style_hints", []),
        mandatory_services=parsed.get("mandatory_services", []),
        confidence=confidence,
    )
