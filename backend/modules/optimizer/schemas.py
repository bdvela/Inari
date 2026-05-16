"""
Schemas del motor de optimización. Completamente independiente del ORM y de la API.
El optimizer solo habla este lenguaje — entrada y salida siempre tipada.
"""
from datetime import date
from pydantic import BaseModel, Field, model_validator


class ProviderOption(BaseModel):
    """Proveedor disponible en el catálogo para la ejecución del optimizador."""
    id: int
    service_id: int
    service_name: str
    nombre: str
    costo: float = Field(..., gt=0)
    # Índice de calidad compuesto normalizado 0.0 - 1.0
    quality_index: float = Field(..., ge=0.0, le=1.0)
    tipos_evento_compatibles: list[str]
    fechas_no_disponibles: list[str]  # ISO "YYYY-MM-DD"
    # Segmento: "basico" = solo cotización básica; "premium" = elegible para ambas
    tier: str = "basico"


class OptimizationInput(BaseModel):
    """Entrada completa del motor de optimización."""
    budget: float = Field(..., gt=0, description="Presupuesto máximo en soles")
    required_services: list[str] = Field(
        ..., description="IDs de servicios obligatorios (deben cubrirse exactamente)"
    )
    optional_services: list[str] = Field(
        default_factory=list, description="IDs de servicios opcionales (se incluyen si hay budget)"
    )
    event_type: str
    event_date: date
    providers: list[ProviderOption]
    # "balanced": minimiza costo (básica) | "premium": maximiza calidad absoluta
    optimization_mode: str = "balanced"
    # Multiplicador de quality_index — deriva de luxury_level detectado en imágenes
    # 1.0 = comportamiento por defecto | >1.0 = favorece calidad | <1.0 = favorece precio
    quality_weight: float = 1.0

    @model_validator(mode="after")
    def validate_providers_not_empty(self) -> "OptimizationInput":
        # Validar en engine, no aquí — para poder devolver feasible=False con reason
        return self


class SelectedProvider(BaseModel):
    """Proveedor seleccionado en el resultado del optimizador."""
    provider_id: int
    service_id: int
    service_name: str
    provider_name: str
    costo: float
    quality_index: float
    es_obligatorio: bool


class OptimizationResult(BaseModel):
    """
    Salida del motor de optimización.
    Interfaz pública — no cambiar sin actualizar tests.
    """
    selected_providers: list[SelectedProvider]
    total_cost: float
    quality_score: float  # promedio ponderado de quality_index de seleccionados
    algorithm_used: str   # "ILP" o "GREEDY"
    feasible: bool
    execution_ms: int
    reason: str = ""      # explicación si infeasible
