"""User service: CRUD operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, RoleEnum
from app.core.security import hash_password
from app.schemas import UserUpdate, UserResponse
from fastapi import HTTPException, status


class UserService:
    """User management service."""
    
    @staticmethod
    async def get_user(db: AsyncSession, user_id: int) -> User:
        """Get user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    @staticmethod
    async def get_user_by_email(
        db: AsyncSession,
        email: str,
        tenant_id: int
    ) -> User:
        """Get user by email in tenant."""
        result = await db.execute(
            select(User).where(
                User.tenant_id == tenant_id,
                User.email == email
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: int,
        data: UserUpdate
    ) -> User:
        """Update user profile."""
        user = await UserService.get_user(db, user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def change_password(
        db: AsyncSession,
        user_id: int,
        new_password: str
    ) -> User:
        """Change user password."""
        user = await UserService.get_user(db, user_id)
        user.hashed_password = hash_password(new_password)
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def verify_user(db: AsyncSession, user_id: int) -> User:
        """Mark user as verified."""
        user = await UserService.get_user(db, user_id)
        user.is_verified = True
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def deactivate_user(db: AsyncSession, user_id: int) -> User:
        """Deactivate user account."""
        user = await UserService.get_user(db, user_id)
        user.is_active = False
        
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def set_user_role(
        db: AsyncSession,
        user_id: int,
        role: RoleEnum,
        requester: User
    ) -> User:
        """Set user role (admin only)."""
        # Authorization check
        if requester.role not in [RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        user = await UserService.get_user(db, user_id)
        
        # Super admin can assign any role, admin cannot assign super_admin
        if requester.role == RoleEnum.ADMIN and role == RoleEnum.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign super_admin role"
            )
        
        user.role = role
        await db.commit()
        await db.refresh(user)
        return user
    
    @staticmethod
    async def list_users(
        db: AsyncSession,
        tenant_id: int,
        skip: int = 0,
        limit: int = 50,
        role: RoleEnum = None
    ) -> list[User]:
        """List users in tenant."""
        query = select(User).where(User.tenant_id == tenant_id)
        
        if role:
            query = query.where(User.role == role)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
