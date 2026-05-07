"""
Inferencia de servicios desde análisis visual de imágenes de referencia.
Filtra, deduplica y mapea suggested_services de Gemini Vision
antes de pasarlos al optimizer como opcionales.
"""

CONFIDENCE_THRESHOLD = 0.6

CATALOG = frozenset([
    "catering", "decoracion", "fotografia", "videografia",
    "musica", "iluminacion", "flores", "torta", "transporte", "animacion",
])

# Mapeo de términos comunes fuera del catálogo al servicio más cercano
_ALIAS_MAP: dict[str, str] = {
    # música
    "dj": "musica", "DJ": "musica", "banda": "musica", "mariachi": "musica",
    "orquesta": "musica", "sonido": "musica",
    # animación
    "show de baile": "animacion", "animador": "animacion", "mago": "animacion",
    "entretenimiento": "animacion", "show": "animacion",
    # decoración
    "ambientacion": "decoracion", "escenografia": "decoracion",
    "arreglos": "decoracion", "montaje": "decoracion",
    # iluminación
    "luces": "iluminacion", "lighting": "iluminacion",
    # flores
    "arreglo floral": "flores", "ramos": "flores", "florales": "flores",
    # fotografía
    "foto": "fotografia", "fotografo": "fotografia",
    # video
    "video": "videografia", "filmacion": "videografia",
    # transporte
    "movilidad": "transporte", "traslado": "transporte",
    # catering
    "buffet": "catering", "comida": "catering", "banquete": "catering",
    "bocaditos": "catering",
    # torta
    "pastel": "torta", "cake": "torta",
}


def _normalize(service: str) -> str | None:
    """Mapea string de Gemini al servicio del catálogo. None si no hay mapeo."""
    clean = service.strip().lower()
    if clean in CATALOG:
        return clean
    if clean in _ALIAS_MAP:
        return _ALIAS_MAP[clean]
    # Búsqueda parcial — si contiene palabra clave del alias
    for alias, mapped in _ALIAS_MAP.items():
        if alias in clean or clean in alias:
            return mapped
    return None


def merge_inferred_services(
    suggested: list[str],
    confidence: float,
    required_services: list[str],
    optional_services: list[str],
    confidence_threshold: float = CONFIDENCE_THRESHOLD,
) -> list[str]:
    """
    Filtra y devuelve servicios inferidos de imágenes listos para el optimizer.

    Reglas:
    - confidence < threshold → retorna []
    - Mapea alias al catálogo, descarta lo que no tiene mapeo
    - Deduplica contra required_services y optional_services
    - Sin duplicados internos en el resultado
    """
    if confidence < confidence_threshold:
        return []

    declared = set(required_services) | set(optional_services)
    seen: set[str] = set()
    result: list[str] = []

    for raw in suggested:
        mapped = _normalize(raw)
        if mapped is None:
            continue
        if mapped in declared:
            continue
        if mapped in seen:
            continue
        seen.add(mapped)
        result.append(mapped)

    return result
