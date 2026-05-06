"""
Tests unitarios — HU: Extracción automática de datos de evento para cotización.
Spec: specs/HU-extraccion-automatica-datos-evento-cotizacion.md
"""
import json
from unittest.mock import patch

import pytest

from backend.modules.visual_analysis.schemas import ParsedDescription
from backend.modules.visual_analysis.text_parser import parse_description


# ─── Fixtures de respuestas Gemini ───────────────────────────────────────────

ALL_FIVE_FIELDS = json.dumps({
    "event_type": "boda",
    "guest_count": 150,
    "approximate_date": "diciembre 2025",
    "max_budget": 25000.0,
    "style_hints": ["elegante", "romántico"],
    "mandatory_services": ["catering", "fotografia"],
    "confidence": 0.92,
})

PARTIAL_NO_DATE_NO_BUDGET = json.dumps({
    "event_type": "cumpleanos",
    "guest_count": 60,
    "approximate_date": None,
    "max_budget": None,
    "style_hints": ["colorido"],
    "mandatory_services": [],
    "confidence": 0.70,
})

ZERO_DATA = json.dumps({
    "event_type": None,
    "guest_count": None,
    "approximate_date": None,
    "max_budget": None,
    "style_hints": [],
    "mandatory_services": [],
    "confidence": 0.10,
    "message": "Incluye tipo de evento, número de invitados y presupuesto.",
})

SECOND_DESCRIPTION = json.dumps({
    "event_type": "cumpleanos",
    "guest_count": 40,
    "approximate_date": "agosto 2026",
    "max_budget": 3000.0,
    "style_hints": ["infantil", "colorido"],
    "mandatory_services": [],
    "confidence": 0.90,
})


def _mock_settings(mock):
    mock.GEMINI_API_KEY = "fake-key"
    mock.VISION_MODEL = "gemini-2.5-flash"


# ─── CA2: Extrae los 5 campos definidos ──────────────────────────────────────

class TestCA2ExtraccionCincoCampos:

    @pytest.mark.asyncio
    async def test_extrae_tipo_evento(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ALL_FIVE_FIELDS),
        ):
            _mock_settings(ms)
            result = await parse_description("boda para 150 personas en diciembre elegante presupuesto 25k")

        assert result.parseable is True
        assert result.event_type == "boda"

    @pytest.mark.asyncio
    async def test_extrae_fecha_aproximada(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ALL_FIVE_FIELDS),
        ):
            _mock_settings(ms)
            result = await parse_description("boda para 150 personas en diciembre elegante presupuesto 25k")

        assert result.approximate_date == "diciembre 2025"

    @pytest.mark.asyncio
    async def test_extrae_numero_invitados(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ALL_FIVE_FIELDS),
        ):
            _mock_settings(ms)
            result = await parse_description("boda para 150 personas en diciembre elegante presupuesto 25k")

        assert result.guest_count == 150

    @pytest.mark.asyncio
    async def test_extrae_presupuesto_maximo(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ALL_FIVE_FIELDS),
        ):
            _mock_settings(ms)
            result = await parse_description("boda para 150 personas en diciembre elegante presupuesto 25k")

        assert result.max_budget == 25000.0

    @pytest.mark.asyncio
    async def test_extrae_preferencias_estilo(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ALL_FIVE_FIELDS),
        ):
            _mock_settings(ms)
            result = await parse_description("boda para 150 personas en diciembre elegante presupuesto 25k")

        assert len(result.style_hints) > 0
        assert "elegante" in result.style_hints


# ─── CA5: Extracción parcial no bloquea el flujo ─────────────────────────────

class TestCA5ExtraccionParcialNoBloquea:

    @pytest.mark.asyncio
    async def test_extraccion_parcial_retorna_parseable_true(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=PARTIAL_NO_DATE_NO_BUDGET),
        ):
            _mock_settings(ms)
            result = await parse_description("cumpleaños para 60 personas ambiente colorido")

        assert result.parseable is True

    @pytest.mark.asyncio
    async def test_campos_faltantes_son_none_no_excepcion(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=PARTIAL_NO_DATE_NO_BUDGET),
        ):
            _mock_settings(ms)
            result = await parse_description("cumpleaños para 60 personas ambiente colorido")

        assert result.approximate_date is None
        assert result.max_budget is None
        assert isinstance(result, ParsedDescription)

    @pytest.mark.asyncio
    async def test_campos_presentes_se_devuelven_correctamente(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=PARTIAL_NO_DATE_NO_BUDGET),
        ):
            _mock_settings(ms)
            result = await parse_description("cumpleaños para 60 personas ambiente colorido")

        assert result.event_type == "cumpleanos"
        assert result.guest_count == 60


# ─── CA6: Sin datos — parseable=False con mensaje de sugerencias ─────────────

class TestCA6SinDatosMensajeSugerencias:

    @pytest.mark.asyncio
    async def test_descripcion_vaga_retorna_parseable_false(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ZERO_DATA),
        ):
            _mock_settings(ms)
            result = await parse_description("quiero hacer algo bonito para mi familia muy pronto")

        assert result.parseable is False

    @pytest.mark.asyncio
    async def test_mensaje_contiene_termino_orientador(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ZERO_DATA),
        ):
            _mock_settings(ms)
            result = await parse_description("quiero hacer algo bonito para mi familia muy pronto")

        assert result.message
        keywords = ["evento", "invitados", "presupuesto", "tipo", "personas", "fecha"]
        assert any(kw in result.message.lower() for kw in keywords)


# ─── CA7: Re-analizar actualiza todos los campos ─────────────────────────────

class TestCA7ReanalisisActualizaCampos:

    @pytest.mark.asyncio
    async def test_segunda_llamada_retorna_datos_frescos(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=ALL_FIVE_FIELDS),
        ):
            _mock_settings(ms)
            result_1 = await parse_description("boda para 150 personas en diciembre elegante 25k")

        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=SECOND_DESCRIPTION),
        ):
            _mock_settings(ms)
            result_2 = await parse_description("cumpleaños infantil 40 personas agosto 3k colorido")

        assert result_2.event_type != result_1.event_type
        assert result_2.guest_count != result_1.guest_count
        assert result_2.approximate_date != result_1.approximate_date
        assert result_2.max_budget != result_1.max_budget

    @pytest.mark.asyncio
    async def test_reanalisis_no_conserva_datos_de_llamada_anterior(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=SECOND_DESCRIPTION),
        ):
            _mock_settings(ms)
            result = await parse_description("cumpleaños infantil 40 personas agosto 3k colorido")

        assert result.event_type == "cumpleanos"
        assert result.guest_count == 40
        assert result.max_budget == 3000.0
        assert result.approximate_date == "agosto 2026"


# ─── CA8: Descripción original guardada en Event ─────────────────────────────

class TestCA8DescripcionOriginalGuardada:

    def test_event_model_tiene_campo_descripcion(self):
        from backend.models.models import Event
        assert hasattr(Event, "descripcion")

    def test_event_creado_con_descripcion_original(self):
        from backend.models.models import Event, EventType
        from datetime import date

        descripcion_original = "quiero una boda para 150 personas en diciembre estilo elegante"
        event = Event(
            cliente_id=1,
            tipo=EventType.BODA,
            fecha=date(2025, 12, 20),
            num_invitados=150,
            presupuesto_maximo=25000.0,
            descripcion=descripcion_original,
        )

        assert event.descripcion == descripcion_original


# ─── Fallo de Gemini — no lanza excepción ────────────────────────────────────

class TestFalloGemini:

    @pytest.mark.asyncio
    async def test_error_api_no_lanza_excepcion(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync",
                  side_effect=Exception("API timeout")),
        ):
            _mock_settings(ms)
            result = await parse_description("boda para 100 personas")

        assert result.parseable is False
        assert result.message is not None


# ─── Regla de negocio: normalize_event_type → EventType enum ─────────────────
# RED — normalize_event_type no existe aún en text_parser.py

class TestNormalizacionTipoEvento:

    def test_boda_mapea_a_enum_boda(self):
        from backend.modules.visual_analysis.text_parser import normalize_event_type
        from backend.models.models import EventType

        assert normalize_event_type("boda") == EventType.BODA

    def test_corporativo_mapea_a_enum_corporativo(self):
        from backend.modules.visual_analysis.text_parser import normalize_event_type
        from backend.models.models import EventType

        assert normalize_event_type("corporativo") == EventType.CORPORATIVO

    def test_cumpleanos_mapea_a_enum_cumpleanos(self):
        from backend.modules.visual_analysis.text_parser import normalize_event_type
        from backend.models.models import EventType

        assert normalize_event_type("cumpleanos") == EventType.CUMPLEANOS

    def test_valor_desconocido_mapea_a_otro(self):
        from backend.modules.visual_analysis.text_parser import normalize_event_type
        from backend.models.models import EventType

        assert normalize_event_type("graduacion") == EventType.OTRO

    def test_none_mapea_a_otro(self):
        from backend.modules.visual_analysis.text_parser import normalize_event_type
        from backend.models.models import EventType

        assert normalize_event_type(None) == EventType.OTRO

    def test_mayusculas_se_normalizan(self):
        from backend.modules.visual_analysis.text_parser import normalize_event_type
        from backend.models.models import EventType

        assert normalize_event_type("BODA") == EventType.BODA
        assert normalize_event_type("Corporativo") == EventType.CORPORATIVO

    @pytest.mark.asyncio
    async def test_gemini_devuelve_valor_invalido_parse_description_retorna_otro(self):
        import json
        from backend.modules.visual_analysis.text_parser import parse_description

        response = json.dumps({
            "event_type": "graduacion",
            "guest_count": 80,
            "approximate_date": "julio 2026",
            "max_budget": 5000.0,
            "style_hints": ["elegante"],
            "mandatory_services": [],
            "confidence": 0.85,
        })

        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync",
                  return_value=response),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await parse_description("graduación de 80 personas en julio presupuesto 5k")

        assert result.parseable is True
        assert result.event_type == "otro"
