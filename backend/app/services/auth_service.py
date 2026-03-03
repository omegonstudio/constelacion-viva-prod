"""Auth service: JWT, password hashing, login/register."""
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, Tenant, RoleEnum, LanguageEnum
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    TokenPayload,
    UserResponse,
)
from fastapi import HTTPException, status
from jose import JWTError


class AuthService:
    """Authentication service."""
    
    @staticmethod
    async def register(
        db: AsyncSession,
        request: RegisterRequest,
    ) -> Tuple[User, TokenResponse]:
        """Register a new user."""
        # Check if tenant exists
        result = await db.execute(
            select(Tenant).where(Tenant.id == request.tenant_id)
        )
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Check if email already exists in tenant
        result = await db.execute(
            select(User).where(
                User.tenant_id == request.tenant_id,
                User.email == request.email
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user = User(
            tenant_id=request.tenant_id,
            email=request.email,
            hashed_password=hash_password(request.password),
            first_name=request.first_name,
            last_name=request.last_name,
            role=RoleEnum.STUDENT,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        
        # Generate tokens
        tokens = AuthService._generate_tokens(user)
        
        await db.commit()
        return user, tokens
    
    @staticmethod
    async def login(
        db: AsyncSession,
        request: LoginRequest,
        tenant_id: int,
    ) -> Tuple[User, TokenResponse]:
        """Login user."""
        # Find user
        result = await db.execute(
            select(User).where(
                User.tenant_id == tenant_id,
                User.email == request.email
            )
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is inactive"
            )
        
        # Generate tokens
        tokens = AuthService._generate_tokens(user)
        return user, tokens
    
    @staticmethod
    async def refresh_token(
        db: AsyncSession,
        request: RefreshTokenRequest,
    ) -> TokenResponse:
        """Refresh access token."""
        try:
            payload = decode_token(request.refresh_token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        tokens = AuthService._generate_tokens(user)
        return tokens

    @staticmethod
    async def refresh_token_from_str(
        db: AsyncSession,
        refresh_token: str,
    ) -> TokenResponse:
        """Refresh token using a raw token string (cookie-based)."""
        return await AuthService.refresh_token(db, RefreshTokenRequest(refresh_token=refresh_token))
    
    @staticmethod
    async def get_current_user(
        db: AsyncSession,
        token: str,
    ) -> User:
        """Get current user from token."""
        try:
            payload = decode_token(token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user_id = int(payload.get("sub"))
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    
    @staticmethod
    def _generate_tokens(user: User) -> TokenResponse:
        """Generate access and refresh tokens."""
        payload = {
            "sub": str(user.id),
            "tenant_id": user.tenant_id,
            "role": user.role.value,
        }
        
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
