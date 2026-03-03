"""Course service: CRUD operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models import Course, User, Module, Lesson, CourseProgress, RoleEnum
from app.schemas import CourseCreate, CourseUpdate
from fastapi import HTTPException, status


class CourseService:
    """Course management service."""
    
    @staticmethod
    async def create_course(
        db: AsyncSession,
        tenant_id: int,
        creator_id: int,
        data: CourseCreate
    ) -> Course:
        """Create a new course."""
        course = Course(
            tenant_id=tenant_id,
            creator_id=creator_id,
            **data.model_dump()
        )
        db.add(course)
        await db.flush()
        await db.refresh(course)
        await db.commit()
        return course
    
    @staticmethod
    async def get_course(
        db: AsyncSession,
        course_id: int,
        tenant_id: int = None
    ) -> Course:
        """Get course by ID."""
        query = select(Course).where(Course.id == course_id)
        
        if tenant_id:
            query = query.where(Course.tenant_id == tenant_id)
        
        query = query.options(
            selectinload(Course.modules),
            selectinload(Course.creator)
        )
        
        result = await db.execute(query)
        course = result.scalar_one_or_none()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return course
    
    @staticmethod
    async def update_course(
        db: AsyncSession,
        course_id: int,
        tenant_id: int,
        data: CourseUpdate,
        requester: User
    ) -> Course:
        """Update course."""
        course = await CourseService.get_course(db, course_id, tenant_id)
        
        # Authorization: creator, admin, or super_admin
        if (course.creator_id != requester.id and
            requester.role not in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(course, key, value)
        
        await db.commit()
        await db.refresh(course)
        return course
    
    @staticmethod
    async def publish_course(
        db: AsyncSession,
        course_id: int,
        tenant_id: int,
        requester: User
    ) -> Course:
        """Publish a course."""
        course = await CourseService.get_course(db, course_id, tenant_id)
        
        # Authorization
        if (course.creator_id != requester.id and
            requester.role not in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        course.is_published = True
        await db.commit()
        await db.refresh(course)
        return course
    
    @staticmethod
    async def list_courses(
        db: AsyncSession,
        tenant_id: int,
        published_only: bool = True,
        skip: int = 0,
        limit: int = 50,
        creator_id: int = None
    ) -> list[Course]:
        """List courses in tenant."""
        query = select(Course).where(Course.tenant_id == tenant_id)
        
        if published_only:
            query = query.where(Course.is_published == True)
        
        if creator_id:
            query = query.where(Course.creator_id == creator_id)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def enroll_student(
        db: AsyncSession,
        course_id: int,
        user_id: int,
        tenant_id: int
    ) -> CourseProgress:
        """Enroll student in course."""
        # Get course
        course = await CourseService.get_course(db, course_id, tenant_id)
        
        # Check if already enrolled
        result = await db.execute(
            select(CourseProgress).where(
                and_(
                    CourseProgress.course_id == course_id,
                    CourseProgress.user_id == user_id
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already enrolled"
            )
        
        # Create progress
        from datetime import datetime, timezone
        progress = CourseProgress(
            user_id=user_id,
            course_id=course_id,
            started_at=datetime.now(timezone.utc)
        )
        
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
        return progress
    
    @staticmethod
    async def get_course_progress(
        db: AsyncSession,
        course_id: int,
        user_id: int
    ) -> CourseProgress:
        """Get student's course progress."""
        result = await db.execute(
            select(CourseProgress).where(
                and_(
                    CourseProgress.course_id == course_id,
                    CourseProgress.user_id == user_id
                )
            ).options(selectinload(CourseProgress.lesson_progress))
        )
        progress = result.scalar_one_or_none()
        
        if not progress:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Progress not found"
            )
        return progress
