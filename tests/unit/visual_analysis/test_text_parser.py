"""Tests unitarios del parser de lenguaje natural."""
import json
from unittest.mock import patch

import pytest

from backend.modules.visual_analysis.text_parser import parse_description, _extract_json
from backend.modules.visual_analysis.schemas import ParsedDescription


FULL_RESPONSE = json.dumps({
    "event_type": "boda",
    "guest_count": 150,
    "approximate_date": "2025-12-20",
    "max_budget": 25000.0,
    "style_hints": ["elegante", "romántico"],
    "mandatory_services": ["catering", "fotografia"],
    "confidence": 0.92,
})

NO_BUDGET_RESPONSE = json.dumps({
    "event_type": "cumpleanos",
    "guest_count": 50,
    "approximate_date": "diciembre 2025",
    "max_budget": None,
    "style_hints": ["divertido"],
    "mandatory_services": [],
    "confidence": 0.75,
})

VAGUE_RESPONSE = json.dumps({
    "event_type": None,
    "guest_count": None,
    "approximate_date": None,
    "max_budget": None,
    "style_hints": [],
    "mandatory_services": [],
    "confidence": 0.15,
    "message": "La descripción es muy vaga. Por favor agrega más detalles.",
})


class TestExtractJson:
    def test_pure_json(self):
        result = _extract_json(FULL_RESPONSE)
        assert result["event_type"] == "boda"

    def test_markdown_wrapped_json(self):
        raw = f"```json\n{FULL_RESPONSE}\n```"
        result = _extract_json(raw)
        assert result["guest_count"] == 150

    def test_json_embedded_in_text(self):
        raw = f"Aquí está el análisis: {FULL_RESPONSE} fin."
        result = _extract_json(raw)
        assert result["event_type"] == "boda"

    def test_invalid_raises(self):
        with pytest.raises(ValueError):
            _extract_json("esto no es json para nada")


class TestParseDescription:

    @pytest.mark.asyncio
    async def test_full_description_all_fields_extracted(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=FULL_RESPONSE),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await parse_description("quiero una boda para 150 personas en diciembre algo elegante 25k")

        assert result.parseable is True
        assert result.event_type == "boda"
        assert result.guest_count == 150
        assert result.max_budget == 25000.0
        assert "elegante" in result.style_hints
        assert result.confidence == 0.92

    @pytest.mark.asyncio
    async def test_description_without_budget_max_budget_is_none(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=NO_BUDGET_RESPONSE),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await parse_description("cumpleaños para 50 personas en diciembre")

        assert result.parseable is True
        assert result.max_budget is None
        assert result.event_type == "cumpleanos"
        assert result.guest_count == 50

    @pytest.mark.asyncio
    async def test_vague_description_returns_parseable_false(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", return_value=VAGUE_RESPONSE),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await parse_description("algo")

        assert result.parseable is False
        assert len(result.message) > 0

    @pytest.mark.asyncio
    async def test_too_short_description_returns_parseable_false_immediately(self):
        with patch("backend.modules.visual_analysis.text_parser.settings") as ms:
            ms.GEMINI_API_KEY = "fake-key"
            result = await parse_description("hi")

        assert result.parseable is False

    @pytest.mark.asyncio
    async def test_gemini_api_error_returns_parseable_false_no_exception(self):
        with (
            patch("backend.modules.visual_analysis.text_parser.settings") as ms,
            patch("backend.modules.visual_analysis.text_parser._call_gemini_text_sync", side_effect=Exception("API timeout")),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await parse_description("quiero una boda para 100 personas en diciembre con presupuesto de 20k")

        assert result.parseable is False
        assert len(result.message) > 0

    @pytest.mark.asyncio
    async def test_missing_api_key_returns_parseable_false(self):
        with patch("backend.modules.visual_analysis.text_parser.settings") as ms:
            ms.GEMINI_API_KEY = ""
            result = await parse_description("quiero una boda para 100 personas con presupuesto de 20k")

        assert result.parseable is False
