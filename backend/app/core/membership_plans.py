"""Therapist membership plans (source of truth).

This module centralizes *plan_months -> price* so endpoints never accept
client-provided prices.

Prices are in the currency unit expected by Mercado Pago `unit_price`.
We keep them as integers for clarity (e.g. ARS pesos).
"""

from __future__ import annotations

# plan_months -> unit_price
MEMBERSHIP_PLANS: dict[int, int] = {
    3: 30000,
    6: 60000,
    12: 120000,
}

# grace days for pending membership after starting checkout
GRACE_DAYS: int = 7

# Mercado Pago currency_id for membership checkout
MP_CURRENCY_ID: str = "ARS"


