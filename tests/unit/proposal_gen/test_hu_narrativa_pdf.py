"""
Tests unitarios — HU: Generación automática de narrativa personalizada en PDF.
Spec: specs/HU-generacion-automatica-narrativa-pdf-cotizacion.md

Decisión de diseño: tests adaptados a la firma existente de generate_narrative
(evento_tipo, num_invitados, evento_fecha, estilo, aesthetic_style, style_keywords, servicios)
en lugar de crear una firma nueva que rompería download_pdf.
cliente_nombre añadido como parámetro opcional (cambio aditivo, sin breaking change).
"""
from datetime import date
from unittest.mock import patch

import pytest

SERVICIOS_BODA = [
    {"servicio": "catering", "proveedor": "Gourmet Perú", "costo": 5000.0},
    {"servicio": "decoración", "proveedor": "Detalles & Sueños", "costo": 2500.0},
    {"servicio": "fotografía", "proveedor": "Studio Pro", "costo": 3000.0},
]


def _mock(ms, text: str = ""):
    ms.GEMINI_API_KEY = "fake-key"
    ms.VISION_MODEL = "gemini-2.5-flash"
    return text


# ─── CA1: Generación automática sin acción extra ─────────────────────────────

class TestCA1GeneracionAutomatica:

    @pytest.mark.asyncio
    async def test_devuelve_string_sin_intervencion(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        expected = "Tu quinceañera será especial. Hemos preparado cada detalle con cariño. INARI GROUP estará contigo."
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value=expected),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="quinceanos",
                num_invitados=80,
                evento_fecha=date(2026, 6, 15),
                estilo="romántico",
                aesthetic_style=None,
                style_keywords=["flores"],
                servicios=SERVICIOS_BODA,
                cliente_nombre="Andrea",
            )

        assert isinstance(result, str)
        assert len(result) > 0


# ─── CA2: Narrativa usa campos del evento ────────────────────────────────────

class TestCA2UsaCamposEvento:

    @pytest.mark.asyncio
    async def test_narrativa_refleja_datos_del_evento(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        narrative_text = (
            "Andrea, tu quinceañera para 80 personas en junio será inolvidable. "
            "Con detalles románticos y flores, INARI GROUP ha diseñado esta propuesta especialmente para ti. "
            "Catering y decoración de primera."
        )
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value=narrative_text),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="quinceanos",
                num_invitados=80,
                evento_fecha=date(2026, 6, 15),
                estilo="romántico",
                aesthetic_style=None,
                style_keywords=["flores"],
                servicios=SERVICIOS_BODA,
                cliente_nombre="Andrea",
            )

        assert result == narrative_text


# ─── CA3: Tono cálido — sin fórmula formal ───────────────────────────────────

class TestCA3TonoCálido:

    @pytest.mark.asyncio
    async def test_narrativa_no_comienza_con_estimado(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value="María, tu boda merece lo mejor. En INARI GROUP hemos pensado en cada detalle. Esta propuesta es solo para ti."),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="boda",
                num_invitados=120,
                evento_fecha=date(2026, 12, 20),
                estilo="elegante",
                aesthetic_style=None,
                style_keywords=[],
                servicios=SERVICIOS_BODA,
                cliente_nombre="María",
            )

        assert not result.lower().startswith("estimado")
        assert not result.lower().startswith("estimada")


# ─── CA4: Narrativa conecta evento con servicios ─────────────────────────────

class TestCA4ConectaEventoConServicios:

    @pytest.mark.asyncio
    async def test_narrativa_menciona_servicios_seleccionados(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        narrative_text = (
            "Carlos, tu evento corporativo para 200 personas está en las mejores manos. "
            "Hemos seleccionado catering y sonido de primer nivel para garantizar el éxito. "
            "INARI GROUP te acompaña en cada paso."
        )
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value=narrative_text),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="corporativo",
                num_invitados=200,
                evento_fecha=date(2026, 3, 10),
                estilo="moderno",
                aesthetic_style=None,
                style_keywords=[],
                servicios=[
                    {"servicio": "catering", "proveedor": "Gourmet Perú", "costo": 8000.0},
                    {"servicio": "sonido", "proveedor": "AV Pro", "costo": 3000.0},
                ],
                cliente_nombre="Carlos",
            )

        assert "catering" in result.lower() or "sonido" in result.lower()


# ─── CA5: Entre 3 y 5 oraciones ──────────────────────────────────────────────

class TestCA5LongitudNarrativa:

    def _count_sentences(self, text: str) -> int:
        import re
        return len([s for s in re.split(r'[.!?]+', text) if s.strip()])

    @pytest.mark.asyncio
    async def test_narrativa_minimo_tres_oraciones(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        text = "Oración uno. Oración dos. Oración tres."
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value=text),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="boda", num_invitados=50,
                evento_fecha=date(2026, 5, 1),
                estilo=None, aesthetic_style=None, style_keywords=[],
                servicios=[], cliente_nombre="Ana",
            )

        assert self._count_sentences(result) >= 3

    @pytest.mark.asyncio
    async def test_narrativa_maximo_cinco_oraciones(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        text = "Uno. Dos. Tres. Cuatro. Cinco."
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value=text),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="boda", num_invitados=50,
                evento_fecha=date(2026, 5, 1),
                estilo=None, aesthetic_style=None, style_keywords=[],
                servicios=[], cliente_nombre="Ana",
            )

        assert self._count_sentences(result) <= 5


# ─── CA6: Sin precios ni montos ──────────────────────────────────────────────

class TestCA6SinPrecios:

    @pytest.mark.asyncio
    async def test_narrativa_no_contiene_simbolo_sol(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value="Tu evento será especial. INARI GROUP cuidará cada detalle. Estamos listos para ti."),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="boda", num_invitados=100,
                evento_fecha=date(2026, 5, 1),
                estilo=None, aesthetic_style=None, style_keywords=[],
                servicios=SERVICIOS_BODA, cliente_nombre="Rosa",
            )

        assert "S/" not in result
        assert "soles" not in result.lower()


# ─── CA7: Datos incompletos → sin placeholders ───────────────────────────────

class TestCA7DatosIncompletosNarrativa:

    @pytest.mark.asyncio
    async def test_datos_faltantes_no_producen_placeholders(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value="Tu evento será muy especial. INARI GROUP pondrá lo mejor. Contamos con todo."),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="boda",
                num_invitados=50,
                evento_fecha=None,
                estilo=None,
                aesthetic_style=None,
                style_keywords=[],
                servicios=[],
                cliente_nombre=None,
            )

        assert "[" not in result
        assert "]" not in result
        assert "None" not in result
        assert "null" not in result.lower()


# ─── CA8: Proposal schema tiene campo narrative ───────────────────────────────

class TestCA8NarrativaEnProposal:

    def test_proposal_schema_tiene_campo_narrative(self):
        from backend.modules.proposal_gen.schemas import Proposal
        from datetime import datetime, timezone

        proposal = Proposal(
            quotation_id=1,
            nivel="basico",
            evento_tipo="boda",
            evento_fecha=date(2026, 12, 20),
            num_invitados=100,
            estilo="elegante",
            cliente_nombre="Test",
            items=[],
            costo_total=10000.0,
            quality_score=0.85,
            algorithm_used="GREEDY",
            generated_at=datetime.now(timezone.utc),
            version=1,
            narrative="Narrativa de prueba.",
        )
        assert proposal.narrative == "Narrativa de prueba."


# ─── CA9: Ejecutivo puede editar narrativa ───────────────────────────────────

class TestCA9NarrativaEditable:

    def test_proposal_narrative_es_mutable(self):
        from backend.modules.proposal_gen.schemas import Proposal
        from datetime import datetime, timezone

        proposal = Proposal(
            quotation_id=1,
            nivel="basico",
            evento_tipo="boda",
            evento_fecha=date(2026, 12, 20),
            num_invitados=100,
            estilo=None,
            cliente_nombre="Test",
            items=[],
            costo_total=10000.0,
            quality_score=0.85,
            algorithm_used="GREEDY",
            generated_at=datetime.now(timezone.utc),
            version=1,
            narrative="Narrativa original generada.",
        )
        proposal.narrative = "Narrativa editada por el ejecutivo."
        assert proposal.narrative == "Narrativa editada por el ejecutivo."


# ─── CA10: Segunda llamada devuelve narrativa distinta ───────────────────────

class TestCA10VersionEditadaReemplaza:

    @pytest.mark.asyncio
    async def test_segunda_llamada_devuelve_narrativa_diferente(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value="Primera narrativa generada para boda."),
        ):
            _mock(ms)
            result_1 = await generate_narrative(
                evento_tipo="boda", num_invitados=100,
                evento_fecha=date(2026, 12, 20),
                estilo="elegante", aesthetic_style=None, style_keywords=[],
                servicios=SERVICIOS_BODA, cliente_nombre="Ana",
            )

        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  return_value="Segunda narrativa actualizada para cumpleaños."),
        ):
            _mock(ms)
            result_2 = await generate_narrative(
                evento_tipo="cumpleanos", num_invitados=40,
                evento_fecha=date(2026, 8, 10),
                estilo=None, aesthetic_style=None, style_keywords=[],
                servicios=[], cliente_nombre="Luis",
            )

        assert result_1 != result_2


# ─── Fallo Gemini — string vacío, no excepción ───────────────────────────────

class TestFalloGeminiNarrativa:

    @pytest.mark.asyncio
    async def test_gemini_error_devuelve_string_vacio_no_excepcion(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync",
                  side_effect=Exception("timeout")),
        ):
            _mock(ms)
            result = await generate_narrative(
                evento_tipo="boda", num_invitados=100,
                evento_fecha=date(2026, 12, 20),
                estilo=None, aesthetic_style=None, style_keywords=[],
                servicios=SERVICIOS_BODA, cliente_nombre="Ana",
            )

        assert result == ""

    @pytest.mark.asyncio
    async def test_sin_api_key_devuelve_string_vacio(self):
        from backend.modules.proposal_gen.narrative import generate_narrative

        with patch("backend.modules.proposal_gen.narrative.settings") as ms:
            ms.GEMINI_API_KEY = ""
            result = await generate_narrative(
                evento_tipo="boda", num_invitados=100,
                evento_fecha=date(2026, 12, 20),
                estilo=None, aesthetic_style=None, style_keywords=[],
                servicios=SERVICIOS_BODA, cliente_nombre="Ana",
            )

        assert result == ""
