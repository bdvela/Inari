"""
Modelo ChatSession — sesión de chat conversacional para cotización.

Cada sesión acumula mensajes y parámetros extraídos de forma incremental.
Una vez confirmada (is_confirmed=True), genera la solicitud de cotización.
"""
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base
from backend.models.base import TimestampMixin


class ChatSession(Base, TimestampMixin):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Lista de {role: "user"|"assistant", content: str, timestamp: str (ISO)}
    messages: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False, default=list
    )
    # Campos de evento extraídos acumulativamente:
    # {tipo_evento, num_invitados, fecha, presupuesto, style_hints, ...}
    extracted_params: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    is_confirmed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    user = relationship("User")
