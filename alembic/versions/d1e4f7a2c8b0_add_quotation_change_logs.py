"""add quotation_change_logs table

Revision ID: d1e4f7a2c8b0
Revises: c4d2e8f1a9b3
Create Date: 2026-05-06

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "d1e4f7a2c8b0"
down_revision: Union[str, None] = "c4d2e8f1a9b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quotation_change_logs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("cotizacion_id", sa.Integer, sa.ForeignKey("quotations.id"), nullable=False, index=True),
        sa.Column("usuario_nombre", sa.String(150), nullable=False),
        sa.Column("usuario_rol", sa.String(50), nullable=False),
        sa.Column("accion", sa.String(100), nullable=False),
        sa.Column("valor_anterior", sa.Text, nullable=True),
        sa.Column("valor_nuevo", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("quotation_change_logs")
