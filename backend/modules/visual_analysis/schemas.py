"""Schemas del módulo de análisis visual."""
from pydantic import BaseModel, Field


class VisualAnalysisResult(BaseModel):
    """
    Salida estructurada del análisis visual de imagen.
    Interfaz pública del módulo — no cambiar sin actualizar client.py y prompts.py.
    """
    event_type: str = Field(..., description="Tipo de evento inferido: boda, corporativo, etc.")
    style: str = Field(..., description="Estilo estético: rustico, moderno, elegante, etc.")
    inferred_services: list[str] = Field(
        default_factory=list,
        description="Servicios visualmente detectados (nombres de categoría)"
    )
    visual_elements: list[str] = Field(
        default_factory=list,
        description="Elementos decorativos identificados en la imagen"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confianza del análisis 0.0-1.0")
    raw_response: str = Field(..., description="Respuesta original del LLM (para debug/log)")
