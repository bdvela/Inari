"""initial_schema

Revision ID: f885370731d7
Revises:
Create Date: 2026-04-14

Crea todas las tablas del dominio según el modelo de datos del PRD sección 9.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f885370731d7"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    userrole = sa.Enum("cliente", "ejecutivo", "admin", name="userrole")
    eventtype = sa.Enum(
        "boda", "corporativo", "cumpleanos", "quinceanos", "conferencia", "otro",
        name="eventtype",
    )
    quotationlevel = sa.Enum("basico", "premium", name="quotationlevel")
    quotationstatus = sa.Enum("procesando", "completado", "error", name="quotationstatus")

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("telefono", sa.String(20), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", userrole, nullable=False, server_default="cliente"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- services ---
    op.create_table(
        "services",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("nombre", sa.String(150), nullable=False, unique=True),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("tipo", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- providers ---
    op.create_table(
        "providers",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("servicio_id", sa.Integer, sa.ForeignKey("services.id"), nullable=False),
        sa.Column("costo_base", sa.Float, nullable=False),
        sa.Column("indice_calidad", sa.Float, nullable=False, server_default="0.5"),
        sa.Column("puntuacion_historica", sa.Float, nullable=False, server_default="0.5"),
        sa.Column("experiencia_en_tipo_evento", sa.Float, nullable=False, server_default="0.5"),
        sa.Column("tipos_evento_compatibles", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("fechas_no_disponibles", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- events ---
    op.create_table(
        "events",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("cliente_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("tipo", eventtype, nullable=False),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("num_invitados", sa.Integer, nullable=False),
        sa.Column("estilo", sa.String(100), nullable=True),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("presupuesto_maximo", sa.Float, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- reference_images ---
    op.create_table(
        "reference_images",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("evento_id", sa.Integer, sa.ForeignKey("events.id"), nullable=False),
        sa.Column("url_storage", sa.String(500), nullable=False),
        sa.Column("nombre_archivo", sa.String(255), nullable=False),
        sa.Column("resultado_analisis", sa.JSON, nullable=True),
        sa.Column("analisis_exitoso", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- quotations ---
    op.create_table(
        "quotations",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("cliente_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("evento_id", sa.Integer, sa.ForeignKey("events.id"), nullable=False),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("nivel", quotationlevel, nullable=False),
        sa.Column("estado", quotationstatus, nullable=False, server_default="procesando"),
        sa.Column("costo_total", sa.Float, nullable=True),
        sa.Column("quality_score", sa.Float, nullable=True),
        sa.Column("pdf_url", sa.String(500), nullable=True),
        sa.Column("parametros_json", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- quotation_details ---
    op.create_table(
        "quotation_details",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("cotizacion_id", sa.Integer, sa.ForeignKey("quotations.id"), nullable=False),
        sa.Column("proveedor_id", sa.Integer, sa.ForeignKey("providers.id"), nullable=False),
        sa.Column("costo_negociado", sa.Float, nullable=False),
        sa.Column("es_obligatorio", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("nombre_servicio", sa.String(150), nullable=False),
    )

    # --- business_rules ---
    op.create_table(
        "business_rules",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("tipo_evento", eventtype, nullable=False),
        sa.Column("servicio_id", sa.Integer, sa.ForeignKey("services.id"), nullable=False),
        sa.Column("es_obligatorio", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("condicion", sa.JSON, nullable=True),
        sa.Column("descripcion", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tipo_evento", "servicio_id", name="uq_rule_event_service"),
    )

    # --- optimization_logs --- (nunca se eliminan)
    op.create_table(
        "optimization_logs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("cotizacion_id", sa.Integer, sa.ForeignKey("quotations.id"), nullable=False),
        sa.Column("input_json", sa.JSON, nullable=False),
        sa.Column("output_json", sa.JSON, nullable=False),
        sa.Column("algoritmo_usado", sa.String(20), nullable=False),
        sa.Column("duracion_ms", sa.Integer, nullable=False),
        sa.Column("es_factible", sa.Boolean, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("optimization_logs")
    op.drop_table("business_rules")
    op.drop_table("quotation_details")
    op.drop_table("quotations")
    op.drop_table("reference_images")
    op.drop_table("events")
    op.drop_table("providers")
    op.drop_table("services")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS quotationstatus")
    op.execute("DROP TYPE IF EXISTS quotationlevel")
    op.execute("DROP TYPE IF EXISTS eventtype")
    op.execute("DROP TYPE IF EXISTS userrole")
