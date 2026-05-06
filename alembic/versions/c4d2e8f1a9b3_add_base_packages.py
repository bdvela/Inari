"""add_base_packages

Revision ID: c4d2e8f1a9b3
Revises: b7e2f1c9d3a5
Create Date: 2026-05-06

Tabla de paquetes de infraestructura propios de INARI GROUP.
Selección automática por rango de invitados (HU-02).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4d2e8f1a9b3"
down_revision: Union[str, None] = "b7e2f1c9d3a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "base_packages",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("cost", sa.Float, nullable=False),
        sa.Column("min_guests", sa.Integer, nullable=False),
        sa.Column("max_guests", sa.Integer, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("base_packages")
