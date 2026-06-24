"""Consumer Agent: ROI calculus, capability purchase, and execution."""

from datetime import datetime, timezone

from app.config import settings
from app.core.cost import estimated_direct_cost_usdc, savings_pct
from app.core.executor import execute_capability
from app.core.payment import (
    build_demo_signature_payload,
    create_ledger_entry,
    create_x402_challenge,
    decode_payment_signature,
    settle_with_facilitator,
    verify_payment_signature,
)
from app.core.registry import registry
from app.db import SessionLocal
from app.models import LedgerRecord
from app.schemas.capability import Capability, CapabilitySummary
from app.schemas.incident import Incident, ResolveRequest, ResolveResponse
from app.schemas.payment import LedgerEntry


def _summary(cap: Capability) -> CapabilitySummary:
    metrics = cap.provenance_metrics
    return CapabilitySummary(
        id=cap.id,
        objective=cap.objective,
        category=cap.category,
        price_usdc=cap.price_usdc,
        sample_runs_analyzed=metrics.sample_runs_analyzed,
        average_latency_reduction_pct=metrics.average_latency_reduction_pct,
        direct_token_saving_pct=metrics.direct_token_saving_pct,
        auditor_address=cap.attestation.auditor_address if cap.attestation else None,
    )


def find_matching_capabilities(incident: Incident) -> list[CapabilitySummary]:
    matches = registry.find_matches(incident.error_code, incident.log_snippet or "")
    return [_summary(cap) for cap in matches]


def resolve_incident(request: ResolveRequest, buyer_address: str = "0x000000000000000000000000000000000000ACE0") -> ResolveResponse:
    """Run the consumer agent economic decision loop."""
    direct_cost = estimated_direct_cost_usdc()
    matches = registry.find_matches(request.incident.error_code, request.incident.log_snippet or "")

    if not matches:
        return ResolveResponse(
            accepted=False,
            message=f"No verified capability found for incident [{request.incident.error_code or 'unknown'}].",
            estimated_direct_cost_usdc=direct_cost,
        )

    candidate = matches[0]
    max_price = request.max_price_usdc or float("inf")
    if candidate.price_usdc > max_price:
        return ResolveResponse(
            accepted=False,
            capability_id=candidate.id,
            price_usdc=candidate.price_usdc,
            estimated_direct_cost_usdc=direct_cost,
            message="Capability price exceeds consumer maximum.",
        )

    if candidate.price_usdc >= direct_cost:
        return ResolveResponse(
            accepted=False,
            capability_id=candidate.id,
            price_usdc=candidate.price_usdc,
            estimated_direct_cost_usdc=direct_cost,
            message="Direct recovery is cheaper than the marketplace pack.",
        )

    return ResolveResponse(
        accepted=True,
        capability_id=candidate.id,
        price_usdc=candidate.price_usdc,
        estimated_direct_cost_usdc=direct_cost,
        savings_pct=savings_pct(candidate.price_usdc, direct_cost),
        decision_points=[dp.model_dump() for dp in candidate.decision_points],
        message=f"ROI Decision: ${candidate.price_usdc:.4f} < ~${direct_cost:.4f} USDC. SECURE PATH CONFIRMED. Action: PURCHASE.",
    )


def purchase_capability(capability_id: str, buyer_address: str = "0x000000000000000000000000000000000000ACE0") -> dict:
    """Emit an x402 payment challenge and a demo payment-signature payload."""
    cap = registry.get(capability_id)
    if cap is None:
        raise ValueError(f"Capability {capability_id} not found")

    challenge = create_x402_challenge(cap.id, cap.price_usdc)
    payload = build_demo_signature_payload(challenge.accepts[0], buyer_address)
    return {
        "challenge": challenge.model_dump(),
        "payment_signature": payload.model_dump(),
    }


async def settle_and_execute(
    capability_id: str,
    payment_signature_header: str,
    context: dict,
) -> dict:
    """Verify x402 payment signature, settle, and run the capability decision tree."""
    cap = registry.get(capability_id)
    if cap is None:
        raise ValueError(f"Capability {capability_id} not found")

    payload = decode_payment_signature(payment_signature_header)
    ok, recovered = verify_payment_signature(payload)
    if not ok:
        raise ValueError("Payment signature verification failed")

    settlement = await settle_with_facilitator(payload)
    entry = create_ledger_entry(
        capability_id=cap.id,
        buyer=payload.payload.authorization.from_address,
        seller=cap.attestation.auditor_address if cap.attestation else settings.SELLER_ADDRESS,
        amount_usdc=cap.price_usdc,
        settlement=settlement,
    )

    db = SessionLocal()
    try:
        record = LedgerRecord(
            capability_id=entry.capability_id,
            buyer=entry.buyer,
            seller=entry.seller,
            amount_usdc=entry.amount_usdc,
            tx_hash=entry.tx_hash,
            status=entry.status,
            created_at=entry.created_at,
            settled_at=entry.settled_at,
        )
        db.add(record)
        db.commit()
    finally:
        db.close()

    trace = execute_capability(cap, context)
    return {
        "settlement": settlement.model_dump(),
        "ledger_entry": LedgerEntry.model_validate(entry.__dict__).model_dump(),
        "trace": [step for step in trace.steps],
    }
