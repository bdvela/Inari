"""
Orquestador de sesiones de chat conversacional para cotizaciones.

Flujo por turno:
  1. Agrega mensaje del usuario a la sesión.
  2. Concatena todos los mensajes del usuario → llama parse_description.
  3. Mergea nuevos campos en extracted_params (None no sobreescribe).
  4. Calcula missing_fields y genera respuesta del asistente.
  5. Persiste y retorna.

Frontera de módulo: NO importa de api/, models/repositories/ ni pdf_gen/.
Solo depende de visual_analysis/text_parser (lógica de extracción existente).
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.chat_session import ChatSession
from backend.modules.visual_analysis.text_parser import parse_description

# ─── Constantes ──────────────────────────────────────────────────────────────

INITIAL_MESSAGE = (
    "¡Hola! Cuéntame sobre el evento que quieres cotizar. "
    "¿Qué tipo de evento es, para cuántas personas y cuándo lo tienes pensado?"
)

REQUIRED_FIELDS = ["tipo_evento", "num_invitados", "fecha", "presupuesto"]

# Pregunta natural para cada campo requerido faltante
_FIELD_QUESTIONS: dict[str, str] = {
    "tipo_evento": (
        "¿Qué tipo de evento vas a realizar? "
        "Por ejemplo: boda, cumpleaños, evento corporativo, quinceañera..."
    ),
    "num_invitados": "¿Para cuántas personas aproximadamente?",
    "fecha": "¿En qué fecha lo tienes pensado?",
    "presupuesto": "¿Con qué presupuesto cuentas para el evento (en soles)?",
}

_SESSION_TTL_HOURS = 24


# ─── Helpers internos ────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_message(role: str, content: str) -> dict[str, Any]:
    return {"role": role, "content": content, "timestamp": _now_iso()}


def _merge_params(
    current: dict[str, Any],
    tipo_evento: str | None,
    num_invitados: int | None,
    fecha: str | None,
    presupuesto: float | None,
    style_hints: list[str],
) -> dict[str, Any]:
    """Merges newly parsed values into current params.
    Non-None new values overwrite; None/empty does NOT overwrite.
    """
    result = current.copy()
    mapping: dict[str, Any] = {
        "tipo_evento": tipo_evento,
        "num_invitados": num_invitados,
        "fecha": fecha,
        "presupuesto": presupuesto,
    }
    for key, val in mapping.items():
        if val is not None and val != "":
            result[key] = val
    if style_hints:
        result["style_hints"] = style_hints
    return result


def _missing_fields(params: dict[str, Any]) -> list[str]:
    return [f for f in REQUIRED_FIELDS if not params.get(f)]


def _build_assistant_message(params: dict[str, Any], missing: list[str]) -> str:
    if not missing:
        tipo = params.get("tipo_evento", "evento")
        invitados = params.get("num_invitados")
        fecha = params.get("fecha", "fecha a confirmar")
        presupuesto = params.get("presupuesto")

        lines = ["Perfecto, déjame resumir tu solicitud:"]
        lines.append(f"• Tipo de evento: {tipo}")
        if invitados is not None:
            lines.append(f"• Invitados: {invitados} personas")
        lines.append(f"• Fecha: {fecha}")
        if presupuesto is not None:
            lines.append(f"• Presupuesto: S/ {presupuesto:,.0f}")
        lines.append("\n¿Confirmas estos datos para generar tu cotización?")
        return "\n".join(lines)

    return _FIELD_QUESTIONS[missing[0]]


# ─── API pública del módulo ───────────────────────────────────────────────────

async def start_session(user_id: int, db: AsyncSession) -> ChatSession:
    """Crea nueva sesión con mensaje de bienvenida."""
    initial = _build_message("assistant", INITIAL_MESSAGE)
    session = ChatSession(
        user_id=user_id,
        messages=[initial],
        extracted_params={},
        is_confirmed=False,
    )
    db.add(session)
    await db.flush()
    return session


async def process_message(
    session_id: str,
    user_message: str,
    db: AsyncSession,
) -> dict[str, Any]:
    """
    Procesa un turno del usuario y devuelve respuesta del asistente.

    Returns:
        {
            assistant_message: str,
            extracted_params: dict,
            missing_fields: list[str],
            is_complete: bool,
        }
    """
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise ValueError(f"Sesión no encontrada: {session_id}")

    # Agregar mensaje del usuario
    session.messages = session.messages + [_build_message("user", user_message)]

    # Concatenar todos los mensajes del usuario para contexto acumulativo
    user_texts = " ".join(
        m["content"] for m in session.messages if m["role"] == "user"
    )

    # Extraer parámetros — delegamos en text_parser existente
    parsed = await parse_description(user_texts)

    # Merge: campos nuevos sobreescriben, None no sobreescribe
    updated_params = _merge_params(
        current=session.extracted_params,
        tipo_evento=parsed.event_type if parsed.parseable else None,
        num_invitados=parsed.guest_count if parsed.parseable else None,
        fecha=parsed.approximate_date if parsed.parseable else None,
        presupuesto=parsed.max_budget if parsed.parseable else None,
        style_hints=parsed.style_hints if parsed.parseable else [],
    )
    session.extracted_params = updated_params

    missing = _missing_fields(updated_params)
    is_complete = len(missing) == 0
    assistant_msg = _build_assistant_message(updated_params, missing)

    session.messages = session.messages + [_build_message("assistant", assistant_msg)]

    await db.flush()

    return {
        "assistant_message": assistant_msg,
        "extracted_params": updated_params,
        "missing_fields": missing,
        "is_complete": is_complete,
    }


async def confirm_session(
    session_id: str,
    db: AsyncSession,
    override_params: dict[str, Any] | None = None,
) -> ChatSession:
    """
    Marca la sesión como confirmada.
    override_params permite ajustar campos antes de confirmar.

    Raises:
        ValueError: si los 4 campos requeridos no están presentes.
    """
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise ValueError(f"Sesión no encontrada: {session_id}")

    params = session.extracted_params.copy()
    if override_params:
        params.update({k: v for k, v in override_params.items() if v is not None})

    missing = _missing_fields(params)
    if missing:
        raise ValueError(
            f"No se puede confirmar la sesión: faltan campos {missing}"
        )

    session.extracted_params = params
    session.is_confirmed = True
    await db.flush()
    return session


async def expire_sessions(db: AsyncSession) -> int:
    """
    Elimina sesiones no confirmadas con más de 24 horas de antigüedad.
    Retorna el número de sesiones eliminadas.
    """
    threshold = datetime.now(timezone.utc) - timedelta(hours=_SESSION_TTL_HOURS)
    result = await db.execute(
        delete(ChatSession)
        .where(ChatSession.is_confirmed.is_(False))
        .where(ChatSession.created_at < threshold)
    )
    await db.flush()
    return result.rowcount
