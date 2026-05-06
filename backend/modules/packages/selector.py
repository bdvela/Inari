"""
Selector de paquetes de servicios propios de INARI GROUP.

Stateless: recibe guest_count + catálogo → devuelve paquete seleccionado.
Nunca lanza excepción salvo NoPackagesConfiguredError (estado inválido del sistema).
"""
from backend.modules.packages.exceptions import NoPackagesConfiguredError
from backend.modules.packages.schemas import PackageOverrideLog, PackageSelectionResult, ServicePackage


def select_package(
    guest_count: int | None,
    packages: list[ServicePackage],
) -> PackageSelectionResult:
    """
    Selecciona el paquete cuyo rango contiene guest_count.

    Reglas:
    - guest_count None  → sin paquete, alerta al ejecutivo.
    - packages vacío    → NoPackagesConfiguredError.
    - límite exacto     → rango superior (max min_guests entre los que coinciden).
    - supera máximo     → paquete mayor + alerta + exceeds_max_range=True.
    """
    if not packages:
        raise NoPackagesConfiguredError(
            "No hay paquetes de servicios configurados. Contacta al administrador."
        )

    if guest_count is None:
        return PackageSelectionResult(
            selected_package=None,
            alert="Número de invitados no capturado. Completa este dato para continuar.",
        )

    max_package = max(packages, key=lambda p: p.max_guests)
    if guest_count > max_package.max_guests:
        return PackageSelectionResult(
            selected_package=max_package,
            alert=(
                f"El número de invitados ({guest_count}) supera el rango máximo "
                f"configurado ({max_package.max_guests}). Verifica con el administrador."
            ),
            exceeds_max_range=True,
        )

    # Límite exacto: si varios rangos coinciden, tomar el de mayor min_guests (rango superior).
    matching = [p for p in packages if p.min_guests <= guest_count <= p.max_guests]
    if matching:
        selected = max(matching, key=lambda p: p.min_guests)
        return PackageSelectionResult(selected_package=selected)

    return PackageSelectionResult(
        selected_package=None,
        alert="No se encontró un paquete para el número de invitados indicado.",
    )


def create_override_log(
    original_package_id: int,
    new_package_id: int,
    justification: str,
    executive_id: int,
) -> PackageOverrideLog:
    """Crea registro de anulación manual de paquete por un ejecutivo."""
    return PackageOverrideLog(
        original_package_id=original_package_id,
        new_package_id=new_package_id,
        justification=justification,
        executive_id=executive_id,
    )
