"""Estimated direct cost logic for the consumer agent ROI calculus."""

from app.config import settings


def estimated_direct_cost_usdc(risk_premium_usdc: float = 0.0) -> float:
    """
    Compute the cost of solving a problem via recursive LLM trial-and-error.

    C_direct = (T_in * P_in) + (T_out * P_out) + risk_premium
    """
    input_cost = settings.ESTIMATED_DIRECT_INPUT_KT * settings.PRICE_INPUT_PER_MT / 1000.0
    output_cost = settings.ESTIMATED_DIRECT_OUTPUT_KT * settings.PRICE_OUTPUT_PER_MT / 1000.0
    return round(input_cost + output_cost + risk_premium_usdc, 4)


def savings_pct(capability_price_usdc: float, direct_cost_usdc: float) -> float:
    if direct_cost_usdc <= 0:
        return 0.0
    return round((1.0 - capability_price_usdc / direct_cost_usdc) * 100.0, 2)
