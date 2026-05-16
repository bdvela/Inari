"""
Schemas de respuesta para el endpoint público de cotización.

Diseñado para NO exponer datos internos:
- sin proveedor_id, proveedor.nombre, costo_base, margen
- sin optimizer_logs, parametros_json internos
"""
from datetime import date

from pydantic import BaseModel, Field


class EventoPublico(BaseModel):
    tipo: str
    fecha: date
    num_invitados: int
    estilo: str | None = None


class PaqueteBase(BaseModel):
    nombre: str
    contenido: str
    costo: float


class ServicioExterno(BaseModel):
    categoria: str       # tipo de servicio: catering, decoracion, fotografia…
    descripcion: str     # nombre legible del servicio
    costo: float         # costo negociado (no costo_base del proveedor)
    es_obligatorio: bool


class CondicionesPago(BaseModel):
    separacion: float = 500.0
    primer_pago_porcentaje: float = 50.0
    segundo_pago_porcentaje: float = 25.0
    tercer_pago_porcentaje: float = 25.0


class VersionAnterior(BaseModel):
    """Resumen de una versión previa de la cotización — sin datos internos."""
    id: int
    version: int
    costo_total: float | None
    created_at: str


class SolicitudAjuste(BaseModel):
    id: int
    mensaje: str
    estado: str   # pendiente | en_revision | resuelto
    created_at: str


class SolicitudAjusteCreate(BaseModel):
    mensaje: str = Field(..., min_length=200, max_length=1000)


class PublicQuotationResponse(BaseModel):
    id: int
    evento: EventoPublico
    paquete_base: PaqueteBase | None = None
    servicios_externos: list[ServicioExterno]
    narrativa: str | None = None
    costo_total: float | None = None
    presupuesto_cliente: float | None = None
    condiciones_pago: CondicionesPago
    versiones_anteriores: list[VersionAnterior]
    expires_at: str
