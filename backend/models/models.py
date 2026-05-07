"""
Modelos SQLAlchemy para todas las entidades del dominio.
Ver PRD sección 9 para modelo de datos conceptual.
"""
import enum
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base
from backend.models.base import TimestampMixin

# Fuerza uso de .value (lowercase) — asyncpg por defecto usa .name (uppercase)
_ENUM_VALUES = staticmethod(lambda obj: [e.value for e in obj])


class UserRole(str, enum.Enum):
    CLIENTE = "cliente"
    EJECUTIVO = "ejecutivo"
    ADMIN = "admin"


class QuotationLevel(str, enum.Enum):
    BASICO = "basico"
    PREMIUM = "premium"


class QuotationStatus(str, enum.Enum):
    PROCESANDO = "procesando"
    COMPLETADO = "completado"
    ERROR = "error"


class EventType(str, enum.Enum):
    BODA = "boda"
    CORPORATIVO = "corporativo"
    CUMPLEANOS = "cumpleanos"
    QUINCEANOS = "quinceanos"
    CONFERENCIA = "conferencia"
    OTRO = "otro"


# ---------------------------------------------------------------------------
# Usuario
# ---------------------------------------------------------------------------
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    telefono: Mapped[str | None] = mapped_column(String(20))
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda obj: [e.value for e in obj], create_type=False),
        nullable=False, default=UserRole.CLIENTE,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    eventos: Mapped[list["Event"]] = relationship("Event", back_populates="cliente")
    cotizaciones: Mapped[list["Quotation"]] = relationship("Quotation", back_populates="cliente")


# ---------------------------------------------------------------------------
# Evento
# ---------------------------------------------------------------------------
class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    tipo: Mapped[EventType] = mapped_column(
        Enum(EventType, values_callable=lambda obj: [e.value for e in obj], create_type=False),
        nullable=False,
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    num_invitados: Mapped[int] = mapped_column(Integer, nullable=False)
    estilo: Mapped[str | None] = mapped_column(String(100))
    descripcion: Mapped[str | None] = mapped_column(Text)
    presupuesto_maximo: Mapped[float] = mapped_column(Float, nullable=False)

    cliente: Mapped[User] = relationship("User", back_populates="eventos")
    imagenes: Mapped[list["ReferenceImage"]] = relationship("ReferenceImage", back_populates="evento")
    cotizaciones: Mapped[list["Quotation"]] = relationship("Quotation", back_populates="evento")


# ---------------------------------------------------------------------------
# Imagen de referencia
# ---------------------------------------------------------------------------
class ReferenceImage(Base, TimestampMixin):
    __tablename__ = "reference_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False)
    url_storage: Mapped[str] = mapped_column(String(500), nullable=False)
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    resultado_analisis: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    analisis_exitoso: Mapped[bool] = mapped_column(Boolean, default=False)

    evento: Mapped[Event] = relationship("Event", back_populates="imagenes")


# ---------------------------------------------------------------------------
# Servicio
# ---------------------------------------------------------------------------
class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # catering, deco, foto, etc.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    proveedores: Mapped[list["Provider"]] = relationship("Provider", back_populates="servicio")
    reglas: Mapped[list["BusinessRule"]] = relationship("BusinessRule", back_populates="servicio")


# ---------------------------------------------------------------------------
# Proveedor
# ---------------------------------------------------------------------------
class Provider(Base, TimestampMixin):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    servicio_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    costo_base: Mapped[float] = mapped_column(Float, nullable=False)
    # Índice de calidad compuesto: 0.0 - 1.0
    indice_calidad: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    puntuacion_historica: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    experiencia_en_tipo_evento: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    # JSON array de EventType strings: ["boda", "corporativo"]
    tipos_evento_compatibles: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    # Fechas no disponibles (JSON array de strings ISO "YYYY-MM-DD")
    fechas_no_disponibles: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    servicio: Mapped[Service] = relationship("Service", back_populates="proveedores")
    detalles: Mapped[list["QuotationDetail"]] = relationship("QuotationDetail", back_populates="proveedor")


# ---------------------------------------------------------------------------
# Cotización
# ---------------------------------------------------------------------------
class Quotation(Base, TimestampMixin):
    __tablename__ = "quotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    evento_id: Mapped[int] = mapped_column(ForeignKey("events.id"), nullable=False)
    # version siempre incrementa; nunca se eliminan cotizaciones
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    nivel: Mapped[QuotationLevel] = mapped_column(
        Enum(QuotationLevel, values_callable=lambda obj: [e.value for e in obj], create_type=False),
        nullable=False,
    )
    estado: Mapped[QuotationStatus] = mapped_column(
        Enum(QuotationStatus, values_callable=lambda obj: [e.value for e in obj], create_type=False),
        nullable=False, default=QuotationStatus.PROCESANDO,
    )
    costo_total: Mapped[float | None] = mapped_column(Float)
    quality_score: Mapped[float | None] = mapped_column(Float)
    # Resultado del análisis de estilo visual (luxury_level, aesthetic_style, etc.)
    style_analysis_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    # Snapshot de parámetros usados (para trazabilidad)
    parametros_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    cliente: Mapped[User] = relationship("User", back_populates="cotizaciones")
    evento: Mapped[Event] = relationship("Event", back_populates="cotizaciones")
    detalles: Mapped[list["QuotationDetail"]] = relationship(
        "QuotationDetail", back_populates="cotizacion", cascade="all, delete-orphan"
    )
    logs: Mapped[list["OptimizationLog"]] = relationship("OptimizationLog", back_populates="cotizacion")
    change_logs: Mapped[list["QuotationChangeLog"]] = relationship("QuotationChangeLog", back_populates="cotizacion", order_by="QuotationChangeLog.created_at")
    requests:    Mapped[list["QuotationRequest"]]   = relationship("QuotationRequest", back_populates="cotizacion", order_by="QuotationRequest.created_at")


# ---------------------------------------------------------------------------
# Detalle de cotización
# ---------------------------------------------------------------------------
class QuotationDetail(Base):
    __tablename__ = "quotation_details"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cotizacion_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    costo_negociado: Mapped[float] = mapped_column(Float, nullable=False)
    es_obligatorio: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    nombre_servicio: Mapped[str] = mapped_column(String(150), nullable=False)

    cotizacion: Mapped[Quotation] = relationship("Quotation", back_populates="detalles")
    proveedor: Mapped[Provider] = relationship("Provider", back_populates="detalles")


# ---------------------------------------------------------------------------
# Regla de negocio
# ---------------------------------------------------------------------------
class BusinessRule(Base, TimestampMixin):
    __tablename__ = "business_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tipo_evento: Mapped[EventType] = mapped_column(
        Enum(EventType, values_callable=lambda obj: [e.value for e in obj], create_type=False),
        nullable=False,
    )
    servicio_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    es_obligatorio: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Condiciones adicionales en JSON (ej. {"min_invitados": 50})
    condicion: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    descripcion: Mapped[str | None] = mapped_column(Text)

    servicio: Mapped[Service] = relationship("Service", back_populates="reglas")

    __table_args__ = (
        UniqueConstraint("tipo_evento", "servicio_id", name="uq_rule_event_service"),
    )


# ---------------------------------------------------------------------------
# Log de optimización — no eliminar jamás
# ---------------------------------------------------------------------------
class OptimizationLog(Base):
    __tablename__ = "optimization_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cotizacion_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False)
    input_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    output_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    algoritmo_usado: Mapped[str] = mapped_column(String(20), nullable=False)  # "ILP" o "GREEDY"
    duracion_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    es_factible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    cotizacion: Mapped[Quotation] = relationship("Quotation", back_populates="logs")


# ---------------------------------------------------------------------------
# Paquete de servicios propios — infraestructura INARI GROUP
# ---------------------------------------------------------------------------
class BasePackage(Base, TimestampMixin):
    __tablename__ = "base_packages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    min_guests: Mapped[int] = mapped_column(Integer, nullable=False)
    max_guests: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


# ---------------------------------------------------------------------------
# Historial de cambios de cotización — auditoría de acciones del ejecutivo
# ---------------------------------------------------------------------------
class QuotationChangeLog(Base):
    __tablename__ = "quotation_change_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cotizacion_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False)
    usuario_nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    usuario_rol: Mapped[str] = mapped_column(String(50), nullable=False)
    accion: Mapped[str] = mapped_column(String(100), nullable=False)
    valor_anterior: Mapped[str | None] = mapped_column(Text)
    valor_nuevo: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    cotizacion: Mapped[Quotation] = relationship("Quotation", back_populates="change_logs")


# ---------------------------------------------------------------------------
# Solicitudes de ajuste del cliente
# ---------------------------------------------------------------------------
class QuotationRequest(Base):
    __tablename__ = "quotation_requests"

    id:           Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    quotation_id: Mapped[int]      = mapped_column(ForeignKey("quotations.id"), nullable=False)
    cliente_id:   Mapped[int]      = mapped_column(ForeignKey("users.id"), nullable=False)
    mensaje:      Mapped[str]      = mapped_column(Text, nullable=False)
    estado:       Mapped[str]      = mapped_column(String(20), nullable=False, default="pendiente")
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    cotizacion: Mapped[Quotation] = relationship("Quotation", back_populates="requests")
    cliente:    Mapped[User]      = relationship("User")
