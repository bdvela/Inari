"""
Estrategia Greedy para el motor de optimización.

Algoritmo:
1. Filtrar proveedores por disponibilidad y compatibilidad de tipo de evento.
2. Agrupar por servicio.
3. Para servicios obligatorios: seleccionar el de mayor ratio quality/costo.
4. Para servicios opcionales: incluir si el mejor disponible cabe en presupuesto restante.

Complejidad: O(n log n) donde n = número de proveedores. Siempre rápido.
Nota: no garantiza optimalidad global, pero es correcto y predecible.
"""
from backend.modules.optimizer.schemas import (
    OptimizationInput,
    OptimizationResult,
    SelectedProvider,
)


def _filter_eligible(inp: OptimizationInput) -> dict[str, list]:
    """
    Retorna {service_id: [ProviderOption]} filtrado por:
    - proveedor activo (siempre activo si llega al optimizer)
    - tipo de evento compatible
    - fecha disponible
    """
    event_date_str = inp.event_date.isoformat()
    eligible: dict[str, list] = {}

    for p in inp.providers:
        sid = str(p.service_id)
        compatible = inp.event_type in p.tipos_evento_compatibles
        available = event_date_str not in p.fechas_no_disponibles
        if compatible and available:
            eligible.setdefault(sid, []).append(p)

    return eligible


def run_greedy(inp: OptimizationInput) -> OptimizationResult:
    """Ejecuta la heurística greedy. Llamar solo desde OptimizerFactory."""
    eligible = _filter_eligible(inp)

    selected: list[SelectedProvider] = []
    remaining_budget = inp.budget

    # Paso 1: servicios obligatorios — deben cubrirse o infeasible
    for service_id in inp.required_services:
        candidates = eligible.get(service_id, [])
        if not candidates:
            return OptimizationResult(
                selected_providers=[],
                total_cost=0.0,
                quality_score=0.0,
                algorithm_used="GREEDY",
                feasible=False,
                execution_ms=0,
                reason=f"No hay proveedores elegibles para servicio obligatorio {service_id}",
            )

        # Ordenar por ratio quality/costo descendente (máxima calidad por sol)
        best = max(candidates, key=lambda p: p.quality_index / p.costo)

        if best.costo > remaining_budget:
            return OptimizationResult(
                selected_providers=[],
                total_cost=0.0,
                quality_score=0.0,
                algorithm_used="GREEDY",
                feasible=False,
                execution_ms=0,
                reason=(
                    f"Presupuesto insuficiente para servicio obligatorio '{best.service_name}' "
                    f"(costo: {best.costo:.2f}, restante: {remaining_budget:.2f})"
                ),
            )

        selected.append(
            SelectedProvider(
                provider_id=best.id,
                service_id=best.service_id,
                service_name=best.service_name,
                provider_name=best.nombre,
                costo=best.costo,
                quality_index=best.quality_index,
                es_obligatorio=True,
            )
        )
        remaining_budget -= best.costo

    # Paso 2: servicios opcionales — si caben, incluir el mejor
    for service_id in inp.optional_services:
        candidates = eligible.get(service_id, [])
        if not candidates:
            continue
        best = max(candidates, key=lambda p: p.quality_index / p.costo)
        if best.costo <= remaining_budget:
            selected.append(
                SelectedProvider(
                    provider_id=best.id,
                    service_id=best.service_id,
                    service_name=best.service_name,
                    provider_name=best.nombre,
                    costo=best.costo,
                    quality_index=best.quality_index,
                    es_obligatorio=False,
                )
            )
            remaining_budget -= best.costo

    total_cost = sum(s.costo for s in selected)
    quality_score = (
        sum(s.quality_index for s in selected) / len(selected) if selected else 0.0
    )

    return OptimizationResult(
        selected_providers=selected,
        total_cost=total_cost,
        quality_score=quality_score,
        algorithm_used="GREEDY",
        feasible=True,
        execution_ms=0,  # seteado por engine.py
    )
