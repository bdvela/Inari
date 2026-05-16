"""add_system_config

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f0
Create Date: 2026-05-16

Tabla de configuración del sistema para parámetros ajustables en tiempo real.
Seed inicial: quality_weight = 1.0 (comportamiento por defecto del optimizer).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a1b2c3d4e5f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "system_config",
        sa.Column("key", sa.String(100), primary_key=True, nullable=False),
        sa.Column("value", sa.JSON, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_by",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    # Seed: valor por defecto del quality_weight del optimizer
    op.execute(
        "INSERT INTO system_config (key, value) "
        "VALUES ('quality_weight', '{\"value\": 1.0}'::jsonb) "
        "ON CONFLICT (key) DO NOTHING"
    )


def downgrade() -> None:
    op.drop_table("system_config")
