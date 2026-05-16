"""
Schemas de respuesta para endpoints de cotización.
"""
from enum import Enum

from pydantic import BaseModel


class QuotationLevelEnum(str, Enum):
    BASICO = "basico"
    PREMIUM = "premium"


class ProviderTierEnum(str, Enum):
    BASICO = "basico"
    PREMIUM = "premium"


class QuotationSummarySchema(BaseModel):
    quotation_id: int
    level: QuotationLevelEnum
    feasible: bool
    costo_total: float | None
    quality_score: float | None


class DualGenerationResponse(BaseModel):
    evento_id: int
    basico: QuotationSummarySchema
    premium: QuotationSummarySchema
    version: int
