"""
Generador de propuestas básica y premium.

El motor de optimización se ejecuta dos veces (PRD sección 7.4):
  - Básica: presupuesto = 100% del cliente, minimiza costo
  - Premium: presupuesto = 130% del cliente, maximiza calidad

Este módulo orquesta ambas ejecuciones y produce Proposal objects.
No tiene lógica de negocio — solo orquesta optimizer y formatea salida.
"""
from datetime import datetime, timezone

from backend.core.config import get_settings
from backend.modules.optimizer.engine import optimize
from backend.modules.optimizer.schemas import OptimizationInput, OptimizationResult
from backend.modules.proposal_gen.schemas import Proposal, ProposalItem

settings = get_settings()


def _build_proposal(
    result: OptimizationResult,
    nivel: str,
    quotation_id: int,
    evento_tipo: str,
    evento_fecha,
    num_invitados: int,
    estilo: str | None,
    cliente_nombre: str,
    version: int,
) -> Proposal:
    items = [
        ProposalItem(
            servicio=sp.service_name,
            proveedor=sp.provider_name,
            costo=sp.costo,
            es_obligatorio=sp.es_obligatorio,
            quality_index=sp.quality_index,
        )
        for sp in result.selected_providers
    ]
    return Proposal(
        quotation_id=quotation_id,
        nivel=nivel,
        evento_tipo=evento_tipo,
        evento_fecha=evento_fecha,
        num_invitados=num_invitados,
        estilo=estilo,
        cliente_nombre=cliente_nombre,
        items=items,
        costo_total=result.total_cost,
        quality_score=result.quality_score,
        algorithm_used=result.algorithm_used,
        generated_at=datetime.now(timezone.utc),
        version=version,
    )


def generate_proposals(
    base_input: OptimizationInput,
    quotation_id_base: int,
    quotation_id_premium: int,
    evento_tipo: str,
    evento_fecha,
    num_invitados: int,
    estilo: str | None,
    cliente_nombre: str,
    version: int,
    all_providers: list | None = None,
) -> tuple[Proposal | None, Proposal | None, OptimizationResult, OptimizationResult]:
    """
    Genera propuesta básica y premium.

    base_input.providers debe contener solo proveedores tier='basico'.
    all_providers (si se pasa) incluye todos los tiers y se usa para el run premium.
    Si all_providers es None, ambas corridas usan base_input.providers (modo sin tier).

    Retorna (basica, premium, result_basica, result_premium).
    Si infeasible, el Proposal correspondiente es None.
    """
    # Básica: presupuesto original, solo proveedores tier='basico'
    result_basica = optimize(base_input)
    basica = None
    if result_basica.feasible:
        basica = _build_proposal(
            result_basica, "basico", quotation_id_base,
            evento_tipo, evento_fecha, num_invitados, estilo, cliente_nombre, version,
        )

    # Premium: presupuesto extendido + modo calidad absoluta + todos los tiers disponibles
    premium_updates: dict = {
        "budget": base_input.budget * settings.PREMIUM_BUDGET_MULTIPLIER,
        "optimization_mode": "premium",
    }
    if all_providers is not None:
        premium_updates["providers"] = all_providers

    premium_input = base_input.model_copy(update=premium_updates)
    result_premium = optimize(premium_input)
    premium = None
    if result_premium.feasible:
        premium = _build_proposal(
            result_premium, "premium", quotation_id_premium,
            evento_tipo, evento_fecha, num_invitados, estilo, cliente_nombre, version,
        )

    return basica, premium, result_basica, result_premium
