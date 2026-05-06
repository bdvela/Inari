"""Tests unitarios del generador de narrativa."""
from datetime import date
from unittest.mock import patch

import pytest

from backend.modules.proposal_gen.narrative import generate_narrative

SERVICIOS = [
    {"servicio": "catering", "proveedor": "Gourmet Perú", "costo": 5800.0},
    {"servicio": "decoracion", "proveedor": "Detalles & Sueños", "costo": 2800.0},
    {"servicio": "fotografia", "proveedor": "Studio Pro", "costo": 3500.0},
]


class TestGenerateNarrative:

    @pytest.mark.asyncio
    async def test_with_style_analysis_returns_non_empty_string(self):
        expected = "Tu boda elegante contará con un catering de primera línea..."
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync", return_value=expected),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await generate_narrative(
                evento_tipo="boda",
                num_invitados=150,
                evento_fecha=date(2025, 12, 20),
                estilo="elegante",
                aesthetic_style="romántico",
                style_keywords=["floral", "íntimo"],
                servicios=SERVICIOS,
            )

        assert result == expected
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_without_style_analysis_returns_valid_narrative(self):
        expected = "Tu cumpleaños especial estará lleno de detalles únicos..."
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync", return_value=expected),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await generate_narrative(
                evento_tipo="cumpleanos",
                num_invitados=50,
                evento_fecha=date(2025, 11, 15),
                estilo=None,
                aesthetic_style=None,
                style_keywords=[],
                servicios=SERVICIOS[:2],
            )

        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_gemini_error_returns_empty_string_no_exception(self):
        with (
            patch("backend.modules.proposal_gen.narrative.settings") as ms,
            patch("backend.modules.proposal_gen.narrative._call_gemini_narrative_sync", side_effect=Exception("API down")),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await generate_narrative(
                evento_tipo="boda",
                num_invitados=100,
                evento_fecha=date(2025, 12, 20),
                estilo=None,
                aesthetic_style=None,
                style_keywords=[],
                servicios=SERVICIOS,
            )

        assert result == ""

    @pytest.mark.asyncio
    async def test_missing_api_key_returns_empty_string(self):
        with patch("backend.modules.proposal_gen.narrative.settings") as ms:
            ms.GEMINI_API_KEY = ""
            result = await generate_narrative(
                evento_tipo="boda",
                num_invitados=100,
                evento_fecha=date(2025, 12, 20),
                estilo=None,
                aesthetic_style=None,
                style_keywords=[],
                servicios=SERVICIOS,
            )

        assert result == ""
