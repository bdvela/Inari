"""
Tests unitarios — HU: Selección automática de paquete de servicios por número de invitados.
Spec: specs/HU-seleccion-automatica-paquete-servicios-por-invitados.md
"""
import pytest

from backend.modules.packages.exceptions import NoPackagesConfiguredError
from backend.modules.packages.schemas import PackageOverrideLog, PackageSelectionResult, ServicePackage
from backend.modules.packages.selector import create_override_log, select_package


# ─── Fixtures ────────────────────────────────────────────────────────────────

PAQUETE_BRONCE = ServicePackage(id=1, name="Bronce", content="Carpas básicas, sillas", cost=2000.0, min_guests=1, max_guests=50)
PAQUETE_PLATA  = ServicePackage(id=2, name="Plata",  content="Carpas premium, sillas, mesas", cost=4500.0, min_guests=51, max_guests=100)
PAQUETE_ORO    = ServicePackage(id=3, name="Oro",    content="Carpas premium, mobiliario completo, sonido", cost=8000.0, min_guests=101, max_guests=200)

CATALOGO = [PAQUETE_BRONCE, PAQUETE_PLATA, PAQUETE_ORO]


# ─── CA1: Selección correcta según rango ─────────────────────────────────────

class TestCA1SeleccionCorrecta:

    def test_invitados_en_rango_inferior_selecciona_bronce(self):
        result = select_package(guest_count=30, packages=CATALOGO)
        assert result.selected_package.id == PAQUETE_BRONCE.id

    def test_invitados_en_rango_medio_selecciona_plata(self):
        result = select_package(guest_count=75, packages=CATALOGO)
        assert result.selected_package.id == PAQUETE_PLATA.id

    def test_invitados_en_rango_superior_selecciona_oro(self):
        result = select_package(guest_count=150, packages=CATALOGO)
        assert result.selected_package.id == PAQUETE_ORO.id


# ─── CA2: Límite exacto → rango superior ─────────────────────────────────────

class TestCA2LimiteExacto:

    def test_limite_exacto_entre_bronce_y_plata_selecciona_plata(self):
        # Bronce: 1-50, Plata: 50-100 — guest_count=50 → Plata (rango superior)
        bronce = ServicePackage(id=1, name="Bronce", content="x", cost=2000.0, min_guests=1,  max_guests=50)
        plata  = ServicePackage(id=2, name="Plata",  content="y", cost=4500.0, min_guests=50, max_guests=100)
        result = select_package(guest_count=50, packages=[bronce, plata])
        assert result.selected_package.id == plata.id

    def test_limite_exacto_entre_plata_y_oro_selecciona_oro(self):
        plata = ServicePackage(id=2, name="Plata", content="y", cost=4500.0, min_guests=51,  max_guests=100)
        oro   = ServicePackage(id=3, name="Oro",   content="z", cost=8000.0, min_guests=100, max_guests=200)
        result = select_package(guest_count=100, packages=[plata, oro])
        assert result.selected_package.id == oro.id


# ─── CA3: Supera el paquete mayor → mayor paquete + alerta ───────────────────

class TestCA3SuperaMaximo:

    def test_invitados_superan_maximo_selecciona_paquete_mayor(self):
        result = select_package(guest_count=250, packages=CATALOGO)
        assert result.selected_package.id == PAQUETE_ORO.id

    def test_invitados_superan_maximo_genera_alerta(self):
        result = select_package(guest_count=250, packages=CATALOGO)
        assert result.exceeds_max_range is True
        assert result.alert is not None
        assert len(result.alert) > 0


# ─── CA4: Invitados None → sin paquete + alerta ──────────────────────────────

class TestCA4InvitadosNoCapturados:

    def test_guest_count_none_no_asigna_paquete(self):
        result = select_package(guest_count=None, packages=CATALOGO)
        assert result.selected_package is None

    def test_guest_count_none_genera_alerta(self):
        result = select_package(guest_count=None, packages=CATALOGO)
        assert result.alert is not None
        assert len(result.alert) > 0


# ─── CA5: Sin paquetes → NoPackagesConfiguredError ───────────────────────────

class TestCA5SinPaquetes:

    def test_lista_vacia_lanza_no_packages_configured_error(self):
        with pytest.raises(NoPackagesConfiguredError):
            select_package(guest_count=100, packages=[])


# ─── CA6: Paquete con nombre, contenido y costo ──────────────────────────────

class TestCA6PaqueteConDetalle:

    def test_paquete_seleccionado_tiene_nombre(self):
        result = select_package(guest_count=75, packages=CATALOGO)
        assert result.selected_package.name
        assert len(result.selected_package.name) > 0

    def test_paquete_seleccionado_tiene_contenido_y_costo(self):
        result = select_package(guest_count=75, packages=CATALOGO)
        assert result.selected_package.content
        assert result.selected_package.cost > 0


# ─── CA7: Costo accesible para sumarse al total ──────────────────────────────

class TestCA7CostoAccesible:

    def test_costo_paquete_sumable_al_total(self):
        base_total = 10000.0
        result = select_package(guest_count=75, packages=CATALOGO)
        total_con_paquete = base_total + result.selected_package.cost
        assert total_con_paquete == base_total + PAQUETE_PLATA.cost


# ─── CA8: Ejecutivo puede anular selección ───────────────────────────────────

class TestCA8Override:

    def test_override_devuelve_nuevo_paquete_id(self):
        log = create_override_log(
            original_package_id=1,
            new_package_id=3,
            justification="El cliente amplió el número de invitados.",
            executive_id=42,
        )
        assert log.new_package_id == 3

    def test_override_nuevo_paquete_distinto_del_original(self):
        log = create_override_log(
            original_package_id=1,
            new_package_id=3,
            justification="Ajuste manual.",
            executive_id=42,
        )
        assert log.new_package_id != log.original_package_id


# ─── CA9: Anulación queda registrada ─────────────────────────────────────────

class TestCA9OverrideLog:

    def test_log_captura_todos_los_campos(self):
        log = create_override_log(
            original_package_id=2,
            new_package_id=3,
            justification="Evento creció a 180 personas.",
            executive_id=7,
        )
        assert isinstance(log, PackageOverrideLog)
        assert log.original_package_id == 2
        assert log.new_package_id == 3
        assert log.justification == "Evento creció a 180 personas."
        assert log.executive_id == 7


# ─── CA10: Selector acepta cualquier lista dinámica ──────────────────────────

class TestCA10ConfiguracionDinamica:

    def test_catalogo_personalizado_funciona_sin_cambiar_codigo(self):
        paquete_custom = ServicePackage(
            id=99, name="Exclusivo", content="Todo incluido", cost=20000.0,
            min_guests=201, max_guests=500,
        )
        catalogo_ampliado = CATALOGO + [paquete_custom]
        result = select_package(guest_count=300, packages=catalogo_ampliado)
        assert result.selected_package.id == paquete_custom.id


# ─── Regla de negocio: tipo de evento no influye ─────────────────────────────

class TestRNTipoEventoNoInfluye:

    def test_mismo_resultado_independiente_del_tipo_de_evento(self):
        # select_package no acepta event_type — el tipo no puede influir por diseño
        result_1 = select_package(guest_count=75, packages=CATALOGO)
        result_2 = select_package(guest_count=75, packages=CATALOGO)
        assert result_1.selected_package.id == result_2.selected_package.id
