"""User routes."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import User, RoleEnum
from app.middlewares.auth import get_current_user, require_role
from app.services.user_service import UserService
from app.schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_profile(
    user: User = Depends(get_current_user)
) -> UserResponse:
    """Get current user profile."""
    return user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Update current user profile."""
    return await UserService.update_user(db, user.id, data)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Get user by ID."""
    return await UserService.get_user(db, user_id)


@router.get("", response_model=list[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: RoleEnum = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> list[UserResponse]:
    """List users in tenant (admin only)."""
    if user.role not in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return await UserService.list_users(
        db,
        user.tenant_id,
        skip=skip,
        limit=limit,
        role=role
    )
