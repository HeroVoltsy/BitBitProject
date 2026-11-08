
"""Restore missing QR ticket and KYC tables.

Revision ID: 20261108_0004
Revises: 20261108_0003
"""

from alembic import op
import sqlalchemy as sa


revision = "20261108_0004"
down_revision = "20261108_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # QR tickets
    op.create_table(
        "qr_tickets",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("attendee_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "checked_in_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("checked_in_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["attendee_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["checked_in_by"],
            ["users.id"],
        ),
        sa.UniqueConstraint(
            "event_id",
            "attendee_id",
            name="uq_qr_ticket_event_attendee",
        ),
    )

    op.create_index(
        "ix_qr_tickets_event_id",
        "qr_tickets",
        ["event_id"],
    )
    op.create_index(
        "ix_qr_tickets_attendee_id",
        "qr_tickets",
        ["attendee_id"],
    )
    op.create_index(
        "ix_qr_tickets_token_hash",
        "qr_tickets",
        ["token_hash"],
        unique=True,
    )

    # KYC submissions
    op.create_table(
        "kyc_submissions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("legal_name", sa.String(length=200), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("id_type", sa.String(length=80), nullable=False),
        sa.Column("id_number_encrypted", sa.Text(), nullable=False),
        sa.Column("document_front_path", sa.String(length=500), nullable=True),
        sa.Column("document_back_path", sa.String(length=500), nullable=True),
        sa.Column("selfie_path", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="pending",
            nullable=True,
        ),
        sa.Column("review_note", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column(
            "reviewed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"],
            ["users.id"],
        ),
    )

    op.create_index(
        "ix_kyc_submissions_user_id",
        "kyc_submissions",
        ["user_id"],
        unique=True,
    )
    op.create_index(
        "ix_kyc_submissions_status",
        "kyc_submissions",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_kyc_submissions_status",
        table_name="kyc_submissions",
    )
    op.drop_index(
        "ix_kyc_submissions_user_id",
        table_name="kyc_submissions",
    )
    op.drop_table("kyc_submissions")

    op.drop_index(
        "ix_qr_tickets_token_hash",
        table_name="qr_tickets",
    )
    op.drop_index(
        "ix_qr_tickets_attendee_id",
        table_name="qr_tickets",
    )
    op.drop_index(
        "ix_qr_tickets_event_id",
        table_name="qr_tickets",
    )
    op.drop_table("qr_tickets")
