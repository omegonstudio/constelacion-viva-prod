"""Simple in-code RBAC mapping."""
from app.models import RoleEnum

ROLE_PERMISSIONS = {
    RoleEnum.SUPER_ADMIN: ["*"],
    RoleEnum.ADMIN: ["users:read", "users:write", "content:write"],
    RoleEnum.STUDENT: ["content:read"],
    RoleEnum.THERAPIST: ["content:read"],
    RoleEnum.SPONSOR: ["content:read"],
}


def get_permissions_for_role(role) -> list[str]:
    if not role:
        return []

    if isinstance(role, str):
        try:
            role = RoleEnum(role)
        except Exception:
            return []

    return ROLE_PERMISSIONS.get(role, [])

