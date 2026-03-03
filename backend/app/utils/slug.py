"""Slug helpers (Objetivo 2)."""

from __future__ import annotations

import re
import unicodedata
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TherapistProfile

_non_alnum_dash = re.compile(r"[^a-z0-9-]+")
_multi_dash = re.compile(r"-{2,}")


def slugify(text: str) -> str:
    text = (text or "").strip().lower()
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.replace(" ", "-")
    text = _non_alnum_dash.sub("-", text)
    text = _multi_dash.sub("-", text).strip("-")
    return text


async def generate_unique_slug(
    base_slug: str,
    session: AsyncSession,
    *,
    tenant_id: int,
    exclude_profile_id: Optional[int] = None,
) -> str:
    """
    Generate unique slug for therapist_profiles, scoped by tenant_id.
    Uses suffix -2, -3... for collisions.
    """
    base = slugify(base_slug) or "terapeuta"
    candidate = base
    i = 2

    while True:
        stmt = select(TherapistProfile.id).where(
            TherapistProfile.tenant_id == tenant_id,
            TherapistProfile.slug == candidate,
        )
        if exclude_profile_id is not None:
            stmt = stmt.where(TherapistProfile.id != exclude_profile_id)

        res = await session.execute(stmt)
        exists = res.first() is not None
        if not exists:
            return candidate

        candidate = f"{base}-{i}"
        i += 1


