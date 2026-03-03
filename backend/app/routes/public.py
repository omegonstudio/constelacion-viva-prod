"""Public (unauthenticated) routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc, and_, or_

from app.db.database import get_db
from app.models import GalleryItem, TherapistMembership, TherapistMembershipStatusEnum, TherapistProfile, User, RoleEnum
from app.schemas import GalleryItemResponse
from datetime import datetime, timezone
from app.utils.therapist_visibility import is_therapist_public_visible

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/gallery", response_model=list[GalleryItemResponse])
async def list_gallery(db: AsyncSession = Depends(get_db)) -> list[GalleryItem]:
    """List public gallery items."""
    result = await db.execute(
        select(GalleryItem).order_by(asc(GalleryItem.id))
    )
    return result.scalars().all()


@router.get("/therapists")
async def list_public_therapists(db: AsyncSession = Depends(get_db)) -> list[dict]:
    """
    List therapists visible publicly.
    Rule: visible if membership is not overdue:
    - active and not expired
    - pending with grace valid
    """
    now = datetime.now(timezone.utc)
    visible_clause = or_(
        and_(
            TherapistMembership.status == TherapistMembershipStatusEnum.ACTIVE,
            or_(TherapistMembership.expires_at.is_(None), TherapistMembership.expires_at >= now),
        ),
        and_(
            TherapistMembership.status == TherapistMembershipStatusEnum.PENDING,
            TherapistMembership.grace_until.is_not(None),
            TherapistMembership.grace_until >= now,
        ),
    )
    result = await db.execute(
        select(User.id, User.email, TherapistProfile.display_name, TherapistProfile.bio, TherapistProfile.slug)
        .join(TherapistMembership, TherapistMembership.user_id == User.id)
        .join(TherapistProfile, TherapistProfile.user_id == User.id, isouter=True)
        .where(User.role == RoleEnum.THERAPIST)
        .where(visible_clause)
    )
    return [
        {
            "user_id": row.id,
            "email": row.email,
            "display_name": row.display_name,
            "bio": row.bio,
            "slug": row.slug,
        }
        for row in result.all()
    ]


@router.get("/therapists/{identifier}")
async def get_public_therapist_detail(identifier: str, db: AsyncSession = Depends(get_db)) -> dict:
    """
    Public therapist detail (minimal).
    - identifier supports numeric user_id (compat).
    - slug support is pending until a persisted slug exists.
    Returns 404 if therapist is not publicly visible by membership rule.
    """
    now = datetime.now(timezone.utc)

    stmt = (
        select(User, TherapistMembership, TherapistProfile)
        .where(User.role == RoleEnum.THERAPIST)
        .join(TherapistMembership, TherapistMembership.user_id == User.id, isouter=True)
        .join(TherapistProfile, TherapistProfile.user_id == User.id, isouter=True)
    )

    if identifier.isdigit():
        stmt = stmt.where(User.id == int(identifier))
    else:
        stmt = stmt.where(TherapistProfile.slug == identifier)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found")

    user, membership, profile = row
    if not is_therapist_public_visible(membership, now=now):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found")

    return {
        "user_id": user.id,
        "email": user.email,
        "display_name": getattr(profile, "display_name", None),
        "bio": getattr(profile, "bio", None),
        "slug": getattr(profile, "slug", None),
    }

