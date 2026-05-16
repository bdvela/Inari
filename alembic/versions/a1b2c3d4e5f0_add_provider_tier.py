"""add_provider_tier

Revision ID: a1b2c3d4e5f0
Revises: f0a1b2c3d4e5
Create Date: 2026-05-16

Segmento de proveedor para cotización dual básica/premium.
Todos los proveedores existentes se migran a tier='basico'.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f0"
down_revision: Union[str, None] = "f0a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "providers",
        sa.Column(
            "tier",
            sa.String(10),
            nullable=False,
            server_default="basico",
        ),
    )
    # Migrar datos: todos los existentes pasan a 'basico'
    op.execute("UPDATE providers SET tier = 'basico'")
    op.create_index("ix_providers_tier", "providers", ["tier"])


def downgrade() -> None:
    op.drop_index("ix_providers_tier", table_name="providers")
    op.drop_column("providers", "tier")
