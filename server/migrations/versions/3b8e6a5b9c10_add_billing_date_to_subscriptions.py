"""add billing date to subscriptions

Revision ID: 3b8e6a5b9c10
Revises: 174ebe3f819b
Create Date: 2026-03-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3b8e6a5b9c10"
down_revision: Union[str, Sequence[str], None] = "174ebe3f819b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "subscriptions",
        sa.Column("billing_date", sa.Date(), nullable=True),
    )
    op.execute("UPDATE subscriptions SET billing_date = CURRENT_DATE WHERE billing_date IS NULL")
    op.alter_column("subscriptions", "billing_date", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("subscriptions", "billing_date")
