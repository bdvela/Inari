"""
Tests unitarios del módulo de análisis visual.
Gemini API siempre mockeada — sin llamadas reales.
"""
import asyncio
import json
from unittest.mock import patch, MagicMock

import pytest

from backend.modules.visual_analysis.client import _parse_llm_response, analyze_image
from backend.modules.visual_analysis.exceptions import VisualAnalysisError


VALID_JSON_RESPONSE = json.dumps({
    "event_type": "boda",
    "style": "elegante",
    "inferred_services": ["catering", "fotografia"],
    "visual_elements": ["flores blancas", "mesa redonda"],
    "confidence": 0.92,
})

FAKE_IMAGE = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50  # cabecera PNG mínima


# ---------------------------------------------------------------------------
# Parsing de respuestas LLM
# ---------------------------------------------------------------------------

class TestParseResponse:

    def test_pure_json_parses_correctly(self):
        result = _parse_llm_response(VALID_JSON_RESPONSE)
        assert result["event_type"] == "boda"
        assert result["confidence"] == 0.92
        assert "catering" in result["inferred_services"]

    def test_json_in_markdown_code_block_parses_correctly(self):
        raw = f"Aquí está el análisis:\n```json\n{VALID_JSON_RESPONSE}\n```\n"
        result = _parse_llm_response(raw)
        assert result["event_type"] == "boda"
        assert result["style"] == "elegante"

    def test_json_in_plain_code_block_parses_correctly(self):
        raw = f"```\n{VALID_JSON_RESPONSE}\n```"
        result = _parse_llm_response(raw)
        assert result["event_type"] == "boda"

    def test_json_embedded_in_text_parses_correctly(self):
        raw = f"El resultado del análisis es {VALID_JSON_RESPONSE} — fin."
        result = _parse_llm_response(raw)
        assert result["event_type"] == "boda"

    def test_invalid_json_raises_visual_analysis_error(self):
        with pytest.raises(VisualAnalysisError):
            _parse_llm_response("Esto no es JSON para nada.")

    def test_empty_string_raises_visual_analysis_error(self):
        with pytest.raises(VisualAnalysisError):
            _parse_llm_response("")

    def test_partial_json_raises_visual_analysis_error(self):
        with pytest.raises(VisualAnalysisError):
            _parse_llm_response('{"event_type": "boda"')  # JSON incompleto


# ---------------------------------------------------------------------------
# analyze_image — flujo completo con Gemini mockeado
# ---------------------------------------------------------------------------

class TestAnalyzeImage:

    @pytest.mark.asyncio
    async def test_successful_analysis_returns_result(self):
        with (
            patch("backend.modules.visual_analysis.client.settings") as mock_settings,
            patch("backend.modules.visual_analysis.client._call_gemini_sync", return_value=VALID_JSON_RESPONSE),
        ):
            mock_settings.GEMINI_API_KEY = "fake-key"
            mock_settings.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_image(FAKE_IMAGE, "foto.png")

        assert result.event_type == "boda"
        assert result.style == "elegante"
        assert result.confidence == 0.92
        assert "catering" in result.inferred_services

    @pytest.mark.asyncio
    async def test_low_confidence_returns_result_anyway(self):
        """Confianza baja es informativa — no bloquea el flujo."""
        low_conf = json.dumps({
            "event_type": "otro",
            "style": "otro",
            "inferred_services": [],
            "visual_elements": [],
            "confidence": 0.2,
        })
        with (
            patch("backend.modules.visual_analysis.client.settings") as mock_settings,
            patch("backend.modules.visual_analysis.client._call_gemini_sync", return_value=low_conf),
        ):
            mock_settings.GEMINI_API_KEY = "fake-key"
            mock_settings.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_image(FAKE_IMAGE, "foto.png")

        assert result.confidence == 0.2
        assert result.event_type == "otro"

    @pytest.mark.asyncio
    async def test_empty_inferred_services_is_valid(self):
        """Lista de servicios vacía es resultado válido (CU-01 flujo alternativo)."""
        resp = json.dumps({
            "event_type": "corporativo",
            "style": "moderno",
            "inferred_services": [],
            "visual_elements": ["proyector", "sillas"],
            "confidence": 0.7,
        })
        with (
            patch("backend.modules.visual_analysis.client.settings") as mock_settings,
            patch("backend.modules.visual_analysis.client._call_gemini_sync", return_value=resp),
        ):
            mock_settings.GEMINI_API_KEY = "fake-key"
            mock_settings.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_image(FAKE_IMAGE, "foto.jpg")

        assert result.inferred_services == []
        assert result.event_type == "corporativo"

    @pytest.mark.asyncio
    async def test_gemini_api_error_raises_visual_analysis_error(self):
        """Error en API de Gemini → VisualAnalysisError."""
        with (
            patch("backend.modules.visual_analysis.client.settings") as mock_settings,
            patch(
                "backend.modules.visual_analysis.client._call_gemini_sync",
                side_effect=Exception("Connection timeout"),
            ),
        ):
            mock_settings.GEMINI_API_KEY = "fake-key"
            mock_settings.VISION_MODEL = "gemini-2.5-flash"
            with pytest.raises(VisualAnalysisError):
                await analyze_image(FAKE_IMAGE, "foto.jpg")

    @pytest.mark.asyncio
    async def test_missing_api_key_raises_visual_analysis_error(self):
        """Sin GEMINI_API_KEY → VisualAnalysisError inmediato."""
        with patch("backend.modules.visual_analysis.client.settings") as mock_settings:
            mock_settings.GEMINI_API_KEY = ""
            with pytest.raises(VisualAnalysisError):
                await analyze_image(FAKE_IMAGE, "foto.jpg")

    @pytest.mark.asyncio
    async def test_unsupported_format_raises_validation_error(self):
        """Formato no soportado (.bmp) → VisualAnalysisError antes de llamar API."""
        with patch("backend.modules.visual_analysis.client.settings") as mock_settings:
            mock_settings.GEMINI_API_KEY = "fake-key"
            mock_settings.VISION_MODEL = "gemini-2.5-flash"
            with pytest.raises(VisualAnalysisError):
                await analyze_image(b"fake", "foto.bmp")
