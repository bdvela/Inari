"""Excepciones del módulo de análisis visual."""


class VisualAnalysisError(Exception):
    """Error durante el análisis de imagen. El endpoint captura esto y permite flujo alternativo."""

    def __init__(self, message: str, cause: Exception | None = None) -> None:
        super().__init__(message)
        self.cause = cause


class ImageValidationError(VisualAnalysisError):
    """Imagen inválida: formato no soportado, tamaño excedido, etc."""


class LLMAPIError(VisualAnalysisError):
    """Error al llamar a la API de Claude."""
