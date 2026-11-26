"""Persist event end times, audiences and saved events.

Revision ID: 20261127_0007
Revises: 20261127_0006
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "20261127_0007"
down_revision = "20261127_0006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("events", sa.Column("ends_at", sa.DateTime(timezone=True)))
    op.add_column("events", sa.Column("audiences", JSONB()))
    op.execute("UPDATE events SET ends_at = starts_at + INTERVAL '4 hours'")
    op.create_table("event_likes",
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True))


def downgrade():
    op.drop_table("event_likes")
    op.drop_column("events", "audiences")
    op.drop_column("events", "ends_at")
