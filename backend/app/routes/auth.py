"""Auth routes: register, login, refresh."""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.auth_service import AuthService
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from app.middlewares.auth import get_current_user
from app.models import User
from app.core.config import get_settings
from app.utils.rbac import get_permissions_for_role
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Register new user."""
    user, tokens = await AuthService.register(db, request)
    return tokens


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set the httpOnly refresh-token cookie.

    The Secure flag is enabled automatically in production so the cookie is
    only transmitted over HTTPS. In development (LocalStack / Docker) it stays
    False to allow plain-HTTP local testing.
    """
    secure = settings.environment == "production"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=secure,
        max_age=7 * 24 * 60 * 60,  # 7 days — aligned with token expiry
        path="/",
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    response: Response = None,
) -> TokenResponse:
    """Login user."""
    user, tokens = await AuthService.login(db, request, tenant_id)
    if response:
        _set_refresh_cookie(response, tokens.refresh_token)
    return tokens


@router.post("/refresh")
async def refresh(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Refresh access token using the httpOnly refresh_token cookie.

    Returns a proper JSON body with the new access_token so the frontend
    can store it, and rotates the refresh_token cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    tokens = await AuthService.refresh_token_from_str(db, refresh_token)

    resp = JSONResponse(content=tokens.model_dump())
    _set_refresh_cookie(resp, tokens.refresh_token)
    return resp


@router.get("/me", response_model=UserResponse)
async def auth_me(user: User = Depends(get_current_user)) -> UserResponse:
    """Return current authenticated user."""
    perms = get_permissions_for_role(user.role)
    return UserResponse(
        **user.__dict__,
        permissions=perms,
    )


@router.post("/logout")
async def logout(response: Response) -> dict:
    """Clear refresh token cookie (stateless logout)."""
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "logged out"}
