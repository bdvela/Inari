"""add quotation_requests table

Revision ID: e2f5a8b3c1d7
Revises: d1e4f7a2c8b0
Create Date: 2026-05-07

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "e2f5a8b3c1d7"
down_revision: Union[str, None] = "d1e4f7a2c8b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quotation_requests",
        sa.Column("id",           sa.Integer(),               nullable=False),
        sa.Column("quotation_id", sa.Integer(),               nullable=False),
        sa.Column("cliente_id",   sa.Integer(),               nullable=False),
        sa.Column("mensaje",      sa.Text(),                  nullable=False),
        sa.Column("estado",       sa.String(20),              nullable=False, server_default="pendiente"),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["quotation_id"], ["quotations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cliente_id"],   ["users.id"],      ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quotation_requests_id",           "quotation_requests", ["id"])
    op.create_index("ix_quotation_requests_quotation_id", "quotation_requests", ["quotation_id"])


def downgrade() -> None:
    op.drop_index("ix_quotation_requests_quotation_id", "quotation_requests")
    op.drop_index("ix_quotation_requests_id",           "quotation_requests")
    op.drop_table("quotation_requests")
