"""add auto renew to subscriptions

Revision ID: 9a4f12c77b31
Revises: 71ccf6759f2a
Create Date: 2026-03-10 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9a4f12c77b31"
down_revision: Union[str, Sequence[str], None] = "71ccf6759f2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "subscriptions",
        sa.Column("auto_renew", sa.Boolean(), nullable=True),
    )
    op.execute("UPDATE subscriptions SET auto_renew = true WHERE auto_renew IS NULL")
    op.alter_column("subscriptions", "auto_renew", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("subscriptions", "auto_renew")
