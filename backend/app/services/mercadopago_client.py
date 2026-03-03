"""Mercado Pago client wrapper (Objetivo 2)."""

from typing import Any

from app.core.config import Settings


def get_mp_access_token(settings: Settings) -> str:
    return settings.mp_access_token or settings.mercado_pago_access_token


def create_membership_preference(
    settings: Settings,
    *,
    user_id: int,
    plan_months: int,
    unit_price: int,
    currency_id: str = "ARS",
    external_reference: str | None = None,
) -> dict[str, Any]:
    """
    Create a Mercado Pago preference for therapist membership.
    Uses official SDK package `mercadopago`.

    NOTE: No split in Objetivo 2; 100% goes to Constelación Viva.
    """
    access_token = get_mp_access_token(settings)
    if not access_token:
        raise RuntimeError("MP_ACCESS_TOKEN is not configured")

    import mercadopago  # official SDK (installed via requirements)

    sdk = mercadopago.SDK(access_token)

    title = f"Membresía terapeuta - {plan_months} meses"

    preference_data = {
        "items": [
            {
                "title": title,
                "quantity": 1,
                "currency_id": currency_id,
                "unit_price": float(unit_price),
            }
        ],
        # Keep default reference compatible with existing webhook parser unless overridden.
        "external_reference": external_reference or f"therapist_membership:{user_id}:{plan_months}",
        "back_urls": {
            "success": f"{settings.frontend_url}/therapist/dashboard",
            "failure": f"{settings.frontend_url}/therapist/dashboard",
            "pending": f"{settings.frontend_url}/therapist/dashboard",
        },
        "auto_return": "approved",
        "notification_url": f"{settings.frontend_url.replace('3000', '8000')}/webhooks/mercadopago",
    }

    result = sdk.preference().create(preference_data)
    if not isinstance(result, dict) or "response" not in result:
        raise RuntimeError("Mercado Pago SDK returned unexpected response")
    return result["response"]


def get_payment(settings: Settings, payment_id: str) -> dict[str, Any]:
    access_token = get_mp_access_token(settings)
    if not access_token:
        raise RuntimeError("MP_ACCESS_TOKEN is not configured")

    import mercadopago  # official SDK

    sdk = mercadopago.SDK(access_token)
    result = sdk.payment().get(payment_id)
    if not isinstance(result, dict) or "response" not in result:
        raise RuntimeError("Mercado Pago SDK returned unexpected payment response")
    return result["response"]


