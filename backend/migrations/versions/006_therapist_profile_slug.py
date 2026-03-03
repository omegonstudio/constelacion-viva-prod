"""add therapist profile slug (per-tenant) + backfill"""

from alembic import op
import sqlalchemy as sa

import re
import unicodedata

# revision identifiers, used by Alembic.
revision = "006_therapist_profile_slug"
down_revision = "005_therapist_memberships"
branch_labels = None
depends_on = None


_non_alnum_dash = re.compile(r"[^a-z0-9-]+")
_multi_dash = re.compile(r"-{2,}")


def _slugify(text: str) -> str:
    text = (text or "").strip().lower()
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.replace(" ", "-")
    text = _non_alnum_dash.sub("-", text)
    text = _multi_dash.sub("-", text).strip("-")
    return text


def upgrade() -> None:
    # tenant_id is required to enforce unique slug per tenant (User is tenant-scoped).
    op.add_column("therapist_profiles", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.add_column("therapist_profiles", sa.Column("slug", sa.String(length=255), nullable=True))

    op.create_index("ix_therapist_profiles_tenant_id", "therapist_profiles", ["tenant_id"])
    op.create_index("ix_therapist_profiles_slug", "therapist_profiles", ["slug"])

    op.create_foreign_key(
        "fk_therapist_profiles_tenant_id",
        "therapist_profiles",
        "tenants",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Backfill tenant_id from users table
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE therapist_profiles tp
            SET tenant_id = u.tenant_id
            FROM users u
            WHERE tp.user_id = u.id AND tp.tenant_id IS NULL
            """
        )
    )

    # Backfill slug for existing rows
    rows = conn.execute(
        sa.text(
            """
            SELECT tp.id, tp.tenant_id, tp.display_name, u.email
            FROM therapist_profiles tp
            JOIN users u ON u.id = tp.user_id
            WHERE tp.slug IS NULL
            ORDER BY tp.id ASC
            """
        )
    ).fetchall()

    for row in rows:
        base = _slugify(row.display_name or "") or _slugify((row.email or "").split("@")[0]) or "terapeuta"
        candidate = base
        i = 2
        while True:
            exists = conn.execute(
                sa.text(
                    "SELECT 1 FROM therapist_profiles WHERE tenant_id = :tenant_id AND slug = :slug LIMIT 1"
                ),
                {"tenant_id": row.tenant_id, "slug": candidate},
            ).fetchone()
            if not exists:
                break
            candidate = f"{base}-{i}"
            i += 1

        conn.execute(
            sa.text("UPDATE therapist_profiles SET slug = :slug WHERE id = :id"),
            {"slug": candidate, "id": row.id},
        )

    # Unique per tenant (allows multiple NULLs in Postgres, which is ok for nullable slugs)
    op.create_unique_constraint(
        "uq_therapist_profiles_tenant_slug",
        "therapist_profiles",
        ["tenant_id", "slug"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_therapist_profiles_tenant_slug", "therapist_profiles", type_="unique")
    op.drop_constraint("fk_therapist_profiles_tenant_id", "therapist_profiles", type_="foreignkey")
    op.drop_index("ix_therapist_profiles_slug", table_name="therapist_profiles")
    op.drop_index("ix_therapist_profiles_tenant_id", table_name="therapist_profiles")
    op.drop_column("therapist_profiles", "slug")
    op.drop_column("therapist_profiles", "tenant_id")


