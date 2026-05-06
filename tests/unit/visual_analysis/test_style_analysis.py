"""Tests unitarios del analizador de imágenes de estilo."""
import json
from unittest.mock import patch

import pytest

from backend.modules.visual_analysis.style_analysis import analyze_style_references
from backend.modules.visual_analysis.schemas import StyleAnalysisResult

FAKE_IMAGE = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50

VALID_STYLE_RESPONSE = json.dumps({
    "dominant_colors": ["blanco", "champagne", "verde oliva"],
    "aesthetic_style": "romántico",
    "luxury_level": 4,
    "style_keywords": ["floral", "íntimo", "cálido", "natural"],
    "confidence": 0.88,
})

MULTI_IMAGE_RESPONSE = json.dumps({
    "dominant_colors": ["negro", "dorado"],
    "aesthetic_style": "elegante clásico",
    "luxury_level": 5,
    "style_keywords": ["opulento", "formal", "simétrico"],
    "confidence": 0.75,
})


class TestAnalyzeStyleReferences:

    @pytest.mark.asyncio
    async def test_single_image_returns_valid_result(self):
        with (
            patch("backend.modules.visual_analysis.style_analysis.settings") as ms,
            patch("backend.modules.visual_analysis.style_analysis._call_gemini_style_sync", return_value=VALID_STYLE_RESPONSE),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_style_references([(FAKE_IMAGE, "ref.jpg")])

        assert isinstance(result, StyleAnalysisResult)
        assert result.aesthetic_style == "romántico"
        assert result.luxury_level == 4
        assert result.confidence == 0.88
        assert "blanco" in result.dominant_colors

    @pytest.mark.asyncio
    async def test_three_images_consolidates_style(self):
        with (
            patch("backend.modules.visual_analysis.style_analysis.settings") as ms,
            patch("backend.modules.visual_analysis.style_analysis._call_gemini_style_sync", return_value=MULTI_IMAGE_RESPONSE),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            images = [(FAKE_IMAGE, f"ref_{i}.jpg") for i in range(3)]
            result = await analyze_style_references(images)

        assert result.aesthetic_style == "elegante clásico"
        assert result.luxury_level == 5

    @pytest.mark.asyncio
    async def test_unsupported_format_skipped_returns_empty(self):
        with (
            patch("backend.modules.visual_analysis.style_analysis.settings") as ms,
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_style_references([(FAKE_IMAGE, "ref.bmp")])

        assert result.confidence == 0.0

    @pytest.mark.asyncio
    async def test_gemini_error_returns_empty_result_no_exception(self):
        with (
            patch("backend.modules.visual_analysis.style_analysis.settings") as ms,
            patch("backend.modules.visual_analysis.style_analysis._call_gemini_style_sync", side_effect=Exception("API error")),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_style_references([(FAKE_IMAGE, "ref.jpg")])

        assert result.confidence == 0.0

    @pytest.mark.asyncio
    async def test_empty_images_returns_empty_result(self):
        with patch("backend.modules.visual_analysis.style_analysis.settings") as ms:
            ms.GEMINI_API_KEY = "fake-key"
            result = await analyze_style_references([])

        assert result.confidence == 0.0

    @pytest.mark.asyncio
    async def test_missing_api_key_returns_empty(self):
        with patch("backend.modules.visual_analysis.style_analysis.settings") as ms:
            ms.GEMINI_API_KEY = ""
            result = await analyze_style_references([(FAKE_IMAGE, "ref.jpg")])

        assert result.confidence == 0.0

    @pytest.mark.asyncio
    async def test_luxury_level_clamped_to_1_5(self):
        response = json.dumps({
            "dominant_colors": [],
            "aesthetic_style": "otro",
            "luxury_level": 99,  # fuera de rango
            "style_keywords": [],
            "confidence": 0.6,
        })
        with (
            patch("backend.modules.visual_analysis.style_analysis.settings") as ms,
            patch("backend.modules.visual_analysis.style_analysis._call_gemini_style_sync", return_value=response),
        ):
            ms.GEMINI_API_KEY = "fake-key"
            ms.VISION_MODEL = "gemini-2.5-flash"
            result = await analyze_style_references([(FAKE_IMAGE, "ref.png")])

        assert result.luxury_level == 5  # clamped
