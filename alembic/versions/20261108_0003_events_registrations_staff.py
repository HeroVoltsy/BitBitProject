"""Create events, event registrations, and event staff.

Revision ID: 20261108_0003
Revises: 20261108_0002
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261108_0003"
down_revision: Union[str, None] = "20261021_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "host_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "promoted",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="published",
            nullable=False,
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
    )

    op.create_index("ix_events_host_id", "events", ["host_id"])
    op.create_index("ix_events_starts_at", "events", ["starts_at"])
    op.create_index("ix_events_status", "events", ["status"])

    op.create_table(
        "event_registrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "event_id",
            sa.Integer(),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "attendee_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="registered",
            nullable=False,
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "event_id",
            "attendee_id",
            name="uq_event_registration_attendee",
        ),
    )

    op.create_index(
        "ix_event_registrations_event_id",
        "event_registrations",
        ["event_id"],
    )
    op.create_index(
        "ix_event_registrations_attendee_id",
        "event_registrations",
        ["attendee_id"],
    )

    op.create_table(
        "event_staff",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "event_id",
            sa.Integer(),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="pending",
            nullable=False,
        ),
        sa.Column(
            "invited_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "event_id",
            "user_id",
            name="uq_event_staff_user",
        ),
    )

    op.create_index("ix_event_staff_event_id", "event_staff", ["event_id"])
    op.create_index("ix_event_staff_user_id", "event_staff", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_event_staff_user_id", table_name="event_staff")
    op.drop_index("ix_event_staff_event_id", table_name="event_staff")
    op.drop_table("event_staff")

    op.drop_index(
        "ix_event_registrations_attendee_id",
        table_name="event_registrations",
    )
    op.drop_index(
        "ix_event_registrations_event_id",
        table_name="event_registrations",
    )
    op.drop_table("event_registrations")

    op.drop_index("ix_events_status", table_name="events")
    op.drop_index("ix_events_starts_at", table_name="events")
    op.drop_index("ix_events_host_id", table_name="events")
    op.drop_table("events")
