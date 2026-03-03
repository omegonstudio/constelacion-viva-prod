"""Course routes."""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import User, RoleEnum
from app.middlewares.auth import get_current_user
from app.services.course_service import CourseService
from app.schemas import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseProgressResponse,
)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", response_model=CourseResponse)
async def create_course(
    data: CourseCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CourseResponse:
    """Create course (therapist with membership or admin)."""
    if user.role not in [RoleEnum.THERAPIST, RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return await CourseService.create_course(
        db,
        user.tenant_id,
        user.id,
        data
    )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CourseResponse:
    """Get course details."""
    return await CourseService.get_course(db, course_id, user.tenant_id)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    data: CourseUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CourseResponse:
    """Update course."""
    return await CourseService.update_course(
        db,
        course_id,
        user.tenant_id,
        data,
        user
    )


@router.post("/{course_id}/publish", response_model=CourseResponse)
async def publish_course(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CourseResponse:
    """Publish course."""
    return await CourseService.publish_course(
        db,
        course_id,
        user.tenant_id,
        user
    )


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    published_only: bool = Query(True),
    creator_id: int = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> list[CourseResponse]:
    """List courses in tenant."""
    return await CourseService.list_courses(
        db,
        user.tenant_id,
        published_only=published_only,
        skip=skip,
        limit=limit,
        creator_id=creator_id
    )


@router.post("/{course_id}/enroll")
async def enroll_course(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Enroll in course."""
    progress = await CourseService.enroll_student(
        db,
        course_id,
        user.id,
        user.tenant_id
    )
    return {"message": "Enrolled successfully", "progress_id": progress.id}


@router.get("/{course_id}/progress", response_model=CourseProgressResponse)
async def get_progress(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CourseProgressResponse:
    """Get course progress for student."""
    return await CourseService.get_course_progress(
        db,
        course_id,
        user.id
    )
