"""
Motor de optimización — punto de entrada público.

Interfaz pública (no cambiar sin actualizar tests):
    optimize(requirements: OptimizationInput) -> OptimizationResult

Decisión de estrategia (ADR-01):
    - Cuenta combinaciones = SUMA_i len(candidatos_por_servicio_i)
    - Si combinaciones < OPTIMIZER_ILP_MAX_COMBINATIONS → ILP (óptimo)
    - Si no → Greedy (rápido, buena aproximación)

El optimizer NO importa nada de api/, models/ ni pdf_gen/.
Solo conoce sus propios schemas. Testeable de forma aislada.
"""
import time

from backend.core.config import get_settings
from backend.modules.optimizer.greedy import run_greedy
from backend.modules.optimizer.ilp import run_ilp
from backend.modules.optimizer.schemas import OptimizationInput, OptimizationResult

settings = get_settings()


def _count_combinations(inp: OptimizationInput) -> int:
    """
    Cuenta combinaciones posibles para decidir estrategia.
    Producto de candidatos por servicio — aproximación conservadora.
    """
    event_date_str = inp.event_date.isoformat()
    all_services = list(set(inp.required_services + inp.optional_services))
    total = 1
    for sid in all_services:
        candidates = [
            p for p in inp.providers
            if str(p.service_id) == sid
            and inp.event_type in p.tipos_evento_compatibles
            and event_date_str not in p.fechas_no_disponibles
        ]
        if candidates:
            total *= len(candidates)
    return total


def optimize(requirements: OptimizationInput) -> OptimizationResult:
    """
    Punto de entrada principal. Selecciona estrategia y mide tiempo de ejecución.
    """
    start = time.perf_counter()

    if not requirements.providers:
        return OptimizationResult(
            selected_providers=[],
            total_cost=0.0,
            quality_score=0.0,
            algorithm_used="GREEDY",
            feasible=False,
            execution_ms=0,
            reason="Catálogo de proveedores vacío",
        )

    combos = _count_combinations(requirements)
    use_ilp = combos < settings.OPTIMIZER_ILP_MAX_COMBINATIONS

    try:
        if use_ilp:
            result = run_ilp(requirements)
        else:
            result = run_greedy(requirements)
    except Exception as exc:
        # Fallback a greedy si ILP falla (ej. PuLP no instalado)
        result = run_greedy(requirements)
        result.reason = f"Fallback a GREEDY por error en ILP: {exc}"

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    result.execution_ms = elapsed_ms
    return result
