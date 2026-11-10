"""Add internal user and administrator permissions.

Revision ID: 20261110_0005
Revises: 20261108_0004
"""

from alembic import op
import sqlalchemy as sa

revision = "20261110_0005"
down_revision = "20261108_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The server default also backfills existing accounts as regular users.
    op.add_column(
        "users",
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
    )
    op.create_check_constraint(
        "ck_users_role", "users", "role IN ('user', 'admin')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_column("users", "role")
