"""Excepciones del módulo de storage."""


class StorageError(Exception):
    """Error al guardar o recuperar archivo."""


class FileTooLargeError(StorageError):
    """Archivo excede límite de tamaño."""


class InvalidFileTypeError(StorageError):
    """Tipo de archivo no permitido."""
