"""Debug endpoints (local/dev only).

No secrets are returned (only masked / boolean).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.middlewares.auth import get_current_user, require_roles
from app.models import RoleEnum, User

router = APIRouter(prefix="/debug", tags=["debug"])


def _mask(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}...{value[-4:]}"


@router.get("/mercadopago")
async def debug_mercadopago_env(
    _: User = Depends(get_current_user),
    __: User = Depends(require_roles(RoleEnum.SUPER_ADMIN)),
) -> dict:
    """
    Debug Mercado Pago settings as seen by the running backend container.
    Requires SUPER_ADMIN auth.
    """
    s = get_settings()
    return {
        "frontend_url": s.frontend_url,
        "mp_back_url_base": s.mp_back_url_base,
        "mp_access_token_present": bool(s.mp_access_token),
        "mp_access_token_masked": _mask(s.mp_access_token),
        "mercado_pago_access_token_present": bool(s.mercado_pago_access_token),
        "mercado_pago_access_token_masked": _mask(s.mercado_pago_access_token),
        "mp_webhook_secret_present": bool(s.mp_webhook_secret),
        "mp_webhook_secret_masked": _mask(s.mp_webhook_secret),
        "mercado_pago_webhook_token_present": bool(s.mercado_pago_webhook_token),
        "mercado_pago_webhook_token_masked": _mask(s.mercado_pago_webhook_token),
    }


