"""Persist account profiles, KYC form fields and private encrypted documents.

Revision ID: 20261127_0006
Revises: 20261110_0005
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "20261127_0006"
down_revision = "20261110_0005"
branch_labels = None
depends_on = None


def upgrade():
    for column in [
        sa.Column("display_name", sa.String(200)),
        sa.Column("account_type", sa.String(20), server_default="attendee", nullable=False),
        sa.Column("business_name", sa.String(100)),
        sa.Column("business_contact", sa.String(200)),
        sa.Column("discovery_profile", JSONB()),
    ]:
        op.add_column("users", column)
    op.create_check_constraint("ck_users_account_type", "users", "account_type IN ('attendee', 'host')")
    op.add_column("kyc_submissions", sa.Column("personal_details", JSONB()))
    op.create_table(
        "kyc_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("submission_id", sa.Integer(), sa.ForeignKey("kyc_submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(10), nullable=False),
        sa.Column("content_type", sa.String(40), nullable=False),
        sa.Column("encrypted_content", sa.LargeBinary(), nullable=False),
        sa.UniqueConstraint("submission_id", "kind", name="uq_kyc_document_kind"),
    )
    op.create_index("ix_kyc_documents_submission_id", "kyc_documents", ["submission_id"])


def downgrade():
    op.drop_table("kyc_documents")
    op.drop_column("kyc_submissions", "personal_details")
    op.drop_constraint("ck_users_account_type", "users", type_="check")
    for name in ["discovery_profile", "business_contact", "business_name", "account_type", "display_name"]:
        op.drop_column("users", name)
