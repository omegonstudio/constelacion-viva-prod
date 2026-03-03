"""Admin/CMS routes."""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models import User, CMSContent, Upload, RoleEnum, TherapistMembership, TherapistMembershipStatusEnum, TherapistProfile
from app.middlewares.auth import require_permissions, require_admin_or_super
from app.schemas import CMSContentCreate, CMSContentResponse, UploadResponse, AdminTherapistListItem, AdminTherapistDetail
from app.services.storage_service import upload_file, S3NotConfiguredError
from app.core.config import get_settings
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()

def _full_name(user: User, profile: TherapistProfile | None) -> str:
    if profile and profile.display_name:
        return profile.display_name
    parts = [p for p in [user.first_name, user.last_name] if p and p.strip()]
    if parts:
        return " ".join(parts)
    return user.email.split("@")[0]


def _derive_payment_status(m: TherapistMembership | None) -> str:
    """
    Derivación estable (sin inventar split/pagos de sesiones):
    - si no hay membership: na
    - ACTIVE + mp_payment_id: paid
    - ACTIVE sin mp_payment_id: pending (estado inconsistente pero posible en dev)
    - PENDING: pending si gracia vigente, overdue si vencida
    - INACTIVE: overdue
    """
    if not m:
        return "na"
    now = datetime.now(timezone.utc)
    if m.status == TherapistMembershipStatusEnum.ACTIVE:
        return "paid" if m.mp_payment_id else "pending"
    if m.status == TherapistMembershipStatusEnum.PENDING:
        if m.grace_until and m.grace_until >= now:
            return "pending"
        return "overdue"
    return "overdue"


def _derive_membership_status(m: TherapistMembership | None) -> TherapistMembershipStatusEnum:
    if not m:
        return TherapistMembershipStatusEnum.INACTIVE
    now = datetime.now(timezone.utc)
    if m.status == TherapistMembershipStatusEnum.ACTIVE:
        if m.expires_at and m.expires_at <= now:
            return TherapistMembershipStatusEnum.INACTIVE
        return TherapistMembershipStatusEnum.ACTIVE
    if m.status == TherapistMembershipStatusEnum.PENDING:
        if m.grace_until and m.grace_until >= now:
            return TherapistMembershipStatusEnum.PENDING
        return TherapistMembershipStatusEnum.INACTIVE
    return TherapistMembershipStatusEnum.INACTIVE


@router.get("/cms", response_model=list[CMSContentResponse])
async def list_cms_content(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db)
) -> list[CMSContentResponse]:
    """List CMS content."""
    result = await db.execute(
        select(CMSContent)
        .where(CMSContent.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/cms", response_model=CMSContentResponse)
async def create_cms_content(
    data: CMSContentCreate,
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db)
) -> CMSContentResponse:
    """Create CMS content."""
    content = CMSContent(
        tenant_id=user.tenant_id,
        **data.model_dump()
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)
    return content


@router.put("/cms/{content_id}", response_model=CMSContentResponse)
async def update_cms_content(
    content_id: int,
    data: CMSContentCreate,
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db)
) -> CMSContentResponse:
    """Update CMS content."""
    result = await db.execute(
        select(CMSContent).where(
            CMSContent.id == content_id,
            CMSContent.tenant_id == user.tenant_id
        )
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    for key, value in data.model_dump().items():
        setattr(content, key, value)
    
    await db.commit()
    await db.refresh(content)
    return content


@router.delete("/cms/{content_id}")
async def delete_cms_content(
    content_id: int,
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Delete CMS content."""
    result = await db.execute(
        select(CMSContent).where(
            CMSContent.id == content_id,
            CMSContent.tenant_id == user.tenant_id
        )
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    await db.delete(content)
    await db.commit()
    
    return {"message": "Deleted successfully"}


@router.get("/users")
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(require_permissions(["users:read"])),
    db: AsyncSession = Depends(get_db)
) -> list:
    """List all users in tenant (admin only)."""
    result = await db.execute(
        select(User.id, User.email, User.role, User.created_at)
        .where(User.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return [
        {
            "id": row.id,
            "email": row.email,
            "role": row.role.value if hasattr(row.role, "value") else str(row.role),
            "created_at": row.created_at,
        }
        for row in result.all()
    ]


@router.get("/therapists", response_model=list[AdminTherapistListItem])
async def list_therapists(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin_or_super),
    db: AsyncSession = Depends(get_db),
) -> list[AdminTherapistListItem]:
    """
    List therapists with membership status for Admin Dashboard (tab Membresías).
    Source of truth:
    - role: User.role == therapist
    - membership_status/payment_status derived from TherapistMembership
    """
    result = await db.execute(
        select(User, TherapistMembership, TherapistProfile)
        .where(User.tenant_id == admin.tenant_id)
        .where(User.role == RoleEnum.THERAPIST)
        .join(TherapistMembership, TherapistMembership.user_id == User.id, isouter=True)
        .join(TherapistProfile, TherapistProfile.user_id == User.id, isouter=True)
        .order_by(User.id.asc())
        .offset(skip)
        .limit(limit)
    )

    items: list[AdminTherapistListItem] = []
    for user, membership, profile in result.all():
        ms = _derive_membership_status(membership)
        items.append(
            AdminTherapistListItem(
                id=user.id,
                full_name=_full_name(user, profile),
                email=user.email,
                role=user.role.value,
                membership_status=ms,
                payment_status=_derive_payment_status(membership),
                grace_until=getattr(membership, "grace_until", None),
                current_period_end=getattr(membership, "expires_at", None),
            )
        )
    return items


@router.get("/therapists/{therapist_id}", response_model=AdminTherapistDetail)
async def get_therapist_detail(
    therapist_id: int,
    admin: User = Depends(require_admin_or_super),
    db: AsyncSession = Depends(get_db),
) -> AdminTherapistDetail:
    result = await db.execute(
        select(User, TherapistMembership, TherapistProfile)
        .where(User.tenant_id == admin.tenant_id)
        .where(User.id == therapist_id)
        .where(User.role == RoleEnum.THERAPIST)
        .join(TherapistMembership, TherapistMembership.user_id == User.id, isouter=True)
        .join(TherapistProfile, TherapistProfile.user_id == User.id, isouter=True)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found")

    user, membership, profile = row
    ms = _derive_membership_status(membership)
    payment = _derive_payment_status(membership)

    return AdminTherapistDetail(
        id=user.id,
        full_name=_full_name(user, profile),
        email=user.email,
        role=user.role.value,
        membership_status=ms,
        payment_status=payment,
        grace_until=getattr(membership, "grace_until", None),
        current_period_end=getattr(membership, "expires_at", None),
        plan_months=getattr(membership, "plan_months", 0) or 0,
        started_at=getattr(membership, "started_at", None),
        mp_preference_id=getattr(membership, "mp_preference_id", None),
        mp_payment_id=getattr(membership, "mp_payment_id", None),
    )


@router.get("/health")
async def admin_health(
    user: User = Depends(require_admin_or_super),
) -> dict:
    """Admin health check (requires admin/super_admin)."""
    return {"status": "ok", "role": user.role.value}


@router.post("/uploads", response_model=UploadResponse)
async def upload_file_admin(
    file: UploadFile = File(...),
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    """Upload a file to S3 (LocalStack in dev) and store metadata."""
    try:
        stored = upload_file(settings, file.file, file.filename, file.content_type)
    except S3NotConfiguredError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    upload = Upload(
        tenant_id=user.tenant_id,
        uploader_id=user.id,
        filename=file.filename,
        key=stored["key"],
        url=stored["url"],
        content_type=file.content_type,
        size=None,
    )
    db.add(upload)
    await db.commit()
    await db.refresh(upload)
    return upload


@router.get("/uploads", response_model=list[UploadResponse])
async def list_uploads(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(require_permissions(["content:write"])),
    db: AsyncSession = Depends(get_db),
) -> list[UploadResponse]:
    result = await db.execute(
        select(Upload)
        .where(Upload.tenant_id == user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
