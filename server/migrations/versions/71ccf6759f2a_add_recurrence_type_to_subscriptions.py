"""add recurrence type to subscriptions

Revision ID: 71ccf6759f2a
Revises: 3b8e6a5b9c10
Create Date: 2026-03-10 16:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "71ccf6759f2a"
down_revision: Union[str, Sequence[str], None] = "3b8e6a5b9c10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "subscriptions",
        sa.Column("recurrence_type", sa.String(length=16), nullable=True),
    )
    op.execute("UPDATE subscriptions SET recurrence_type = 'monthly' WHERE recurrence_type IS NULL")
    op.alter_column("subscriptions", "recurrence_type", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("subscriptions", "recurrence_type")
