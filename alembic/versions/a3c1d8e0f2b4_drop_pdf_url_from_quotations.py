"""drop_pdf_url_from_quotations

Revision ID: a3c1d8e0f2b4
Revises: f885370731d7
Create Date: 2026-04-28

PDF se genera on-demand — el campo pdf_url nunca se persistía.
Eliminar para mantener el modelo limpio.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3c1d8e0f2b4"
down_revision: Union[str, None] = "f885370731d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("quotations", "pdf_url")


def downgrade() -> None:
    op.add_column(
        "quotations",
        sa.Column("pdf_url", sa.String(500), nullable=True),
    )
