"""add therapist profiles and memberships"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "005_therapist_memberships"
down_revision = "004_media_assets"
branch_labels = None
depends_on = None


def upgrade() -> None:
    status_enum = postgresql.ENUM(
        "pending",
        "active",
        "inactive",
        name="therapistmembershipstatusenum",
        create_type=True,
    )

    op.create_table(
        "therapist_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("bio", sa.String(length=2000), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_therapist_profiles_user_id", "therapist_profiles", ["user_id"])

    op.create_table(
        "therapist_memberships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", status_enum, nullable=False, server_default="pending"),
        sa.Column("plan_months", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("grace_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("mp_preference_id", sa.String(length=255), nullable=True),
        sa.Column("mp_checkout_url", sa.String(length=2000), nullable=True),
        sa.Column("mp_payment_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("mp_payment_id"),
        sa.CheckConstraint("plan_months IN (3, 6, 12)", name="ck_therapist_memberships_plan_months"),
    )
    op.create_index("ix_therapist_memberships_user_id", "therapist_memberships", ["user_id"])


def downgrade() -> None:
    op.drop_table("therapist_memberships")
    op.drop_table("therapist_profiles")
    op.execute("DROP TYPE IF EXISTS therapistmembershipstatusenum")


