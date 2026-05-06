"""add_style_analysis_to_quotations

Revision ID: b7e2f1c9d3a5
Revises: a3c1d8e0f2b4
Create Date: 2026-04-29

Almacena el análisis de estilo visual (StyleAnalysisResult) por cotización.
Permite personalizar el optimizer con luxury_level y mostrar estilo detectado en el resultado.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e2f1c9d3a5"
down_revision: Union[str, None] = "a3c1d8e0f2b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "quotations",
        sa.Column("style_analysis_json", sa.JSON, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("quotations", "style_analysis_json")
