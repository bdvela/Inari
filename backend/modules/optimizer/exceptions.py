"""Excepciones del módulo optimizer."""


class OptimizerError(Exception):
    """Base para errores del motor de optimización."""


class InfeasibleProblemError(OptimizerError):
    """Problema sin solución factible (presupuesto insuficiente, sin proveedores)."""


class EmptyCatalogError(OptimizerError):
    """Catálogo de proveedores vacío."""
