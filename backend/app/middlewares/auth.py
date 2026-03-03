"""Authentication middleware."""
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth_service import AuthService
from app.models import User, RoleEnum
from app.db.database import get_db
from app.utils.rbac import get_permissions_for_role

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = credentials.credentials
    user = await AuthService.get_current_user(db, token)
    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Dependency: get optional user (may not be authenticated)."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    try:
        user = await AuthService.get_current_user(db, token)
        return user
    except:
        return None


def require_role(allowed_roles: list[str]):
    """Dependency factory: require specific role."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return role_checker

def require_roles(*allowed_roles: RoleEnum | str):
    """
    Dependency factory: require any of the given roles.

    - Accepts RoleEnum values or strings ("therapist", "admin", ...)
    - Keeps existing require_role(list[str]) API intact (no breaking change)
    """
    allowed = []
    for r in allowed_roles:
        if isinstance(r, RoleEnum):
            allowed.append(r.value)
        else:
            allowed.append(str(r))
    return require_role(allowed)


def require_permissions(required: list[str]):
    """Dependency factory: require specific permissions based on role."""
    async def permission_checker(user: User = Depends(get_current_user)) -> User:
        role_permissions = get_permissions_for_role(user.role)
        if "*" in role_permissions:
            return user
        missing = [p for p in required if p not in role_permissions]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return permission_checker


async def require_admin_or_super(user: User = Depends(get_current_user)) -> User:
    if user.role not in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
