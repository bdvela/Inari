"""
Estrategia ILP (Programación Lineal Entera) con PuLP.

Formulación formal (del PRD sección 7.1):
  Variables: x[i][j] ∈ {0,1} donde x[i][j]=1 si se selecciona proveedor j para servicio i
  Objetivo: Maximizar SUMA(i,j) quality[i][j] * x[i][j]
  Restricciones:
    - Presupuesto: SUMA(i,j) costo[i][j] * x[i][j] <= P
    - Cobertura obligatoria: SUMA_j x[i][j] = 1  para cada i en required_services
    - Cobertura opcional: SUMA_j x[i][j] <= 1    para cada i en optional_services
    - Disponibilidad/compatibilidad: x[i][j] = 0 si no elegible

Garantiza optimalidad para instancias pequeñas (< 500 combinaciones).
"""
import pulp

from backend.modules.optimizer.schemas import (
    OptimizationInput,
    OptimizationResult,
    SelectedProvider,
)


def run_ilp(inp: OptimizationInput) -> OptimizationResult:
    """Ejecuta el solver ILP. Llamar solo desde OptimizerFactory."""
    event_date_str = inp.event_date.isoformat()

    # Construir conjunto de proveedores elegibles por servicio
    # eligible[service_id] = [ProviderOption]
    eligible: dict[str, list] = {}
    for p in inp.providers:
        sid = str(p.service_id)
        if (
            inp.event_type in p.tipos_evento_compatibles
            and event_date_str not in p.fechas_no_disponibles
        ):
            eligible.setdefault(sid, []).append(p)

    # Verificar que todos los servicios obligatorios tienen candidatos
    for sid in inp.required_services:
        if not eligible.get(sid):
            return OptimizationResult(
                selected_providers=[],
                total_cost=0.0,
                quality_score=0.0,
                algorithm_used="ILP",
                feasible=False,
                execution_ms=0,
                reason=f"No hay proveedores elegibles para servicio obligatorio {sid}",
            )

    all_services = list(set(inp.required_services + inp.optional_services))

    # Crear problema de maximización
    prob = pulp.LpProblem("OptimizadorProveedores", pulp.LpMaximize)

    # Variables de decisión: x[(service_id, provider_id)] ∈ {0, 1}
    x: dict[tuple, pulp.LpVariable] = {}
    for sid in all_services:
        for p in eligible.get(sid, []):
            var_name = f"x_{sid}_{p.id}"
            x[(sid, p.id)] = pulp.LpVariable(var_name, cat="Binary")

    # Función objetivo: maximizar calidad ponderada por quality_weight del estilo
    qw = inp.quality_weight
    prob += pulp.lpSum(
        p.quality_index * qw * x[(sid, p.id)]
        for sid in all_services
        for p in eligible.get(sid, [])
        if (sid, p.id) in x
    )

    # Restricción de presupuesto
    prob += (
        pulp.lpSum(
            p.costo * x[(sid, p.id)]
            for sid in all_services
            for p in eligible.get(sid, [])
            if (sid, p.id) in x
        )
        <= inp.budget,
        "Presupuesto",
    )

    # Restricción de cobertura obligatoria: exactamente 1 por servicio
    for sid in inp.required_services:
        prob += (
            pulp.lpSum(x[(sid, p.id)] for p in eligible.get(sid, [])) == 1,
            f"Obligatorio_{sid}",
        )

    # Restricción de cobertura opcional: máximo 1 por servicio
    for sid in inp.optional_services:
        candidates = eligible.get(sid, [])
        if candidates:
            prob += (
                pulp.lpSum(x[(sid, p.id)] for p in candidates) <= 1,
                f"Opcional_{sid}",
            )

    # Resolver (silencioso)
    solver = pulp.PULP_CBC_CMD(msg=0)
    prob.solve(solver)

    if prob.status != pulp.LpStatusOptimal:
        return OptimizationResult(
            selected_providers=[],
            total_cost=0.0,
            quality_score=0.0,
            algorithm_used="ILP",
            feasible=False,
            execution_ms=0,
            reason=f"ILP infactible o sin solución óptima. Estado: {pulp.LpStatus[prob.status]}",
        )

    # Extraer solución
    selected: list[SelectedProvider] = []
    provider_map = {p.id: p for sid in all_services for p in eligible.get(sid, [])}

    for (sid, pid), var in x.items():
        if pulp.value(var) and pulp.value(var) > 0.5:
            p = provider_map[pid]
            selected.append(
                SelectedProvider(
                    provider_id=p.id,
                    service_id=p.service_id,
                    service_name=p.service_name,
                    provider_name=p.nombre,
                    costo=p.costo,
                    quality_index=p.quality_index,
                    es_obligatorio=sid in inp.required_services,
                )
            )

    total_cost = sum(s.costo for s in selected)
    quality_score = (
        sum(s.quality_index for s in selected) / len(selected) if selected else 0.0
    )

    return OptimizationResult(
        selected_providers=selected,
        total_cost=total_cost,
        quality_score=quality_score,
        algorithm_used="ILP",
        feasible=True,
        execution_ms=0,  # seteado por engine.py
    )
