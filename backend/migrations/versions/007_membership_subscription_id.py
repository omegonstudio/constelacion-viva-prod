"""Add mp_subscription_id to therapist_memberships

Revision ID: 007_membership_subscription_id
Revises: 006_therapist_profile_slug
Create Date: 2026-02-06
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "007_membership_subscription_id"
down_revision = "006_therapist_profile_slug"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("therapist_memberships", sa.Column("mp_subscription_id", sa.String(length=255), nullable=True))
    op.create_unique_constraint("uq_therapist_memberships_mp_subscription_id", "therapist_memberships", ["mp_subscription_id"])


def downgrade() -> None:
    op.drop_constraint("uq_therapist_memberships_mp_subscription_id", "therapist_memberships", type_="unique")
    op.drop_column("therapist_memberships", "mp_subscription_id")


