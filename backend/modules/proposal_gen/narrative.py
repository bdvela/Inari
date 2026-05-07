"""
Generador de descripción narrativa de la propuesta usando Gemini.
Gemini redacta el evento como ejecutivo de ventas — 2-3 párrafos, 200 palabras máx.
Nunca lanza excepción — retorna string vacío si falla.
"""
import asyncio
from datetime import date
from functools import partial

from google import genai
from google.genai import types

from backend.core.config import get_settings
from backend.core.logging import get_logger
from backend.modules.proposal_gen.prompts import NARRATIVE_SYSTEM_PROMPT

logger = get_logger("proposal_gen.narrative")
settings = get_settings()

EVENT_LABELS = {
    "boda": "boda", "corporativo": "evento corporativo",
    "cumpleanos": "cumpleaños", "quinceanos": "quinceañera",
    "conferencia": "conferencia", "otro": "evento especial",
}


def _call_gemini_narrative_sync(prompt: str) -> str:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.VISION_MODEL,
        contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
        config=types.GenerateContentConfig(temperature=0.7, max_output_tokens=1500),
    )
    text = response.text or ""
    finish = getattr(response.candidates[0], "finish_reason", "unknown") if response.candidates else "unknown"
    logger.info("Narrativa generada: %d chars, finish_reason=%s", len(text), finish)
    # Limpiar markdown residual: asteriscos, guiones de lista, backticks
    import re
    text = re.sub(r'\*+([^*]+)\*+', r'\1', text)   # *bold* → bold
    text = re.sub(r'`([^`]+)`', r'\1', text)         # `code` → code
    text = re.sub(r'^\s*[-•]\s+', '', text, flags=re.MULTILINE)  # listas
    text = text.strip()
    return text


async def generate_narrative(
    evento_tipo: str,
    num_invitados: int,
    evento_fecha: date | None,
    estilo: str | None,
    aesthetic_style: str | None,
    style_keywords: list[str],
    servicios: list[dict],  # [{"servicio": str, "proveedor": str, "costo": float}]
    cliente_nombre: str | None = None,
) -> str:
    """
    Genera descripción narrativa personalizada de la propuesta.
    Retorna string vacío si Gemini falla — no bloquea el PDF.
    """
    if not settings.GEMINI_API_KEY:
        return ""

    try:
        tipo_label = EVENT_LABELS.get(evento_tipo, evento_tipo)
        fecha_str = evento_fecha.strftime("%d de %B de %Y") if evento_fecha else "fecha por confirmar"

        servicios_lines = "\n".join(
            f"- {s['servicio'].capitalize()}: {s['proveedor']}"
            for s in servicios[:12]
        )

        style_context = ""
        if aesthetic_style and aesthetic_style != "otro":
            style_context = f"\nEstilo detectado en imágenes de referencia: {aesthetic_style}"
            if style_keywords:
                style_context += f" ({', '.join(style_keywords[:4])})"
        elif estilo:
            style_context = f"\nEstilo solicitado por el cliente: {estilo}"

        cliente_line = f"- Cliente: {cliente_nombre}\n" if cliente_nombre else ""
        prompt = (
            f"{NARRATIVE_SYSTEM_PROMPT}\n\n"
            f"Datos del evento:\n"
            f"{cliente_line}"
            f"- Tipo: {tipo_label}\n"
            f"- Fecha: {fecha_str}\n"
            f"- Invitados: {num_invitados} personas{style_context}\n\n"
            f"Servicios incluidos:\n{servicios_lines}\n\n"
            f"Redacta la descripción narrativa ahora:"
        )

        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(None, partial(_call_gemini_narrative_sync, prompt))
        return text[:1800]  # límite de seguridad

    except Exception as exc:
        logger.warning("Error generando narrativa (no bloquea PDF): %s", exc)
        return ""
