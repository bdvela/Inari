"""Schemas del módulo de análisis visual y procesamiento de lenguaje natural."""
from pydantic import BaseModel, Field


class ParsedDescription(BaseModel):
    """Resultado del parser de descripción libre de evento."""
    parseable: bool
    message: str = ""                    # mensaje si parseable=False
    event_type: str | None = None
    guest_count: int | None = None
    approximate_date: str | None = None  # "diciembre 2025" o "2025-12-15"
    max_budget: float | None = None
    style_hints: list[str] = []
    mandatory_services: list[str] = []
    confidence: float = 0.0


class StyleAnalysisResult(BaseModel):
    """Resultado del análisis de imágenes de referencia de estilo."""
    dominant_colors: list[str] = []
    aesthetic_style: str = "otro"        # romántico, minimalista, rústico, elegante, moderno, bohemio
    luxury_level: int = 3                # 1 (económico) a 5 (máximo lujo)
    style_keywords: list[str] = []
    visual_elements: list[str] = []      # elementos decorativos detectados
    suggested_services: list[str] = []  # servicios inferidos de las imágenes
    confidence: float = 0.0


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
