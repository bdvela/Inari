"""
Tests unitarios — HU: Inferencia automática de servicios desde imágenes de referencia.
Spec: specs/HU-inferencia-servicios-desde-imagenes-referencia.md
"""
import pytest

from backend.modules.visual_analysis.service_inference import merge_inferred_services


# ─── CA: confianza < 0.6 → no añadir al optimizer ────────────────────────────

class TestCA_ConfianzaBaja:

    def test_confidence_below_threshold_returns_empty(self):
        result = merge_inferred_services(
            suggested=["flores", "decoracion"],
            confidence=0.59,
            required_services=["catering"],
            optional_services=[],
        )
        assert result == []

    def test_confidence_exactly_at_threshold_returns_services(self):
        result = merge_inferred_services(
            suggested=["flores"],
            confidence=0.6,
            required_services=[],
            optional_services=[],
        )
        assert "flores" in result

    def test_confidence_zero_returns_empty(self):
        result = merge_inferred_services(
            suggested=["flores", "musica", "decoracion"],
            confidence=0.0,
            required_services=[],
            optional_services=[],
        )
        assert result == []


# ─── CA: servicios ya en texto no se duplican ────────────────────────────────

class TestCA_Deduplicacion:

    def test_service_in_required_not_added_to_optional(self):
        result = merge_inferred_services(
            suggested=["catering", "flores"],
            confidence=0.85,
            required_services=["catering"],
            optional_services=[],
        )
        assert "catering" not in result
        assert "flores" in result

    def test_service_already_optional_not_duplicated(self):
        result = merge_inferred_services(
            suggested=["fotografia", "flores"],
            confidence=0.85,
            required_services=[],
            optional_services=["fotografia"],
        )
        assert result.count("fotografia") == 0
        assert "flores" in result

    def test_all_suggested_already_declared_returns_empty(self):
        result = merge_inferred_services(
            suggested=["catering", "decoracion"],
            confidence=0.9,
            required_services=["catering"],
            optional_services=["decoracion"],
        )
        assert result == []


# ─── CA: servicios fuera de catálogo → mapear o descartar ────────────────────

class TestCA_MapeoFueraDeCatalogo:

    def test_unknown_service_maps_to_closest(self):
        # "show de baile" → "animacion"
        result = merge_inferred_services(
            suggested=["show de baile"],
            confidence=0.8,
            required_services=[],
            optional_services=[],
        )
        assert "animacion" in result

    def test_dj_maps_to_musica(self):
        result = merge_inferred_services(
            suggested=["DJ"],
            confidence=0.8,
            required_services=[],
            optional_services=[],
        )
        assert "musica" in result

    def test_ambientacion_maps_to_decoracion(self):
        result = merge_inferred_services(
            suggested=["ambientacion"],
            confidence=0.8,
            required_services=[],
            optional_services=[],
        )
        assert "decoracion" in result

    def test_unmappable_service_discarded(self):
        # "seguridad" no existe en catálogo ni tiene mapeo cercano
        result = merge_inferred_services(
            suggested=["seguridad_vip_exclusivo"],
            confidence=0.8,
            required_services=[],
            optional_services=[],
        )
        assert result == []

    def test_mixed_known_and_unknown(self):
        result = merge_inferred_services(
            suggested=["flores", "servicio_inexistente_xyz"],
            confidence=0.8,
            required_services=[],
            optional_services=[],
        )
        assert "flores" in result
        assert "servicio_inexistente_xyz" not in result


# ─── CA: sin servicios sugeridos → sin cambios ───────────────────────────────

class TestCA_SinServicios:

    def test_empty_suggested_returns_empty(self):
        result = merge_inferred_services(
            suggested=[],
            confidence=0.9,
            required_services=["catering"],
            optional_services=["fotografia"],
        )
        assert result == []


# ─── CA: servicios válidos del catálogo pasan ────────────────────────────────

class TestCA_ServiciosValidos:

    def test_catalog_services_pass_through(self):
        catalog = ["catering", "decoracion", "fotografia", "videografia",
                   "musica", "iluminacion", "flores", "torta", "transporte", "animacion"]
        result = merge_inferred_services(
            suggested=catalog,
            confidence=0.9,
            required_services=[],
            optional_services=[],
        )
        assert set(result) == set(catalog)

    def test_result_has_no_duplicates(self):
        result = merge_inferred_services(
            suggested=["flores", "flores", "musica"],
            confidence=0.9,
            required_services=[],
            optional_services=[],
        )
        assert len(result) == len(set(result))

    def test_high_confidence_includes_all_valid_new_services(self):
        result = merge_inferred_services(
            suggested=["flores", "iluminacion", "videografia"],
            confidence=0.95,
            required_services=["catering", "decoracion"],
            optional_services=["fotografia"],
        )
        assert "flores" in result
        assert "iluminacion" in result
        assert "videografia" in result
        assert len(result) == 3
