"""Capability registry endpoints with x402 paywalled downloads."""

from fastapi import APIRouter, Header, HTTPException, Response

from app.core.payment import (
    create_ledger_entry,
    create_x402_challenge,
    decode_payment_signature,
    encode_challenge,
    settle_with_facilitator,
    verify_payment_signature,
)
from app.core.registry import registry
from app.db import SessionLocal
from app.models import LedgerRecord
from app.schemas.capability import Capability, CapabilitySummary
from app.schemas.payment import LedgerEntry

router = APIRouter(prefix="/capabilities", tags=["capabilities"])


@router.get("", response_model=list[CapabilitySummary])
def list_capabilities() -> list[CapabilitySummary]:
    summaries: list[CapabilitySummary] = []
    for cap in registry.list_all():
        metrics = cap.provenance_metrics
        summaries.append(
            CapabilitySummary(
                id=cap.id,
                objective=cap.objective,
                category=cap.category,
                price_usdc=cap.price_usdc,
                sample_runs_analyzed=metrics.sample_runs_analyzed,
                average_latency_reduction_pct=metrics.average_latency_reduction_pct,
                direct_token_saving_pct=metrics.direct_token_saving_pct,
                auditor_address=cap.attestation.auditor_address if cap.attestation else None,
            )
        )
    return summaries


@router.get("/{capability_id}", response_model=Capability)
def get_capability(capability_id: str) -> Capability:
    cap = registry.get(capability_id)
    if cap is None:
        raise HTTPException(status_code=404, detail="Capability not found")
    return cap


@router.get("/{capability_id}/download")
async def download_capability(
    capability_id: str,
    payment_signature: str | None = Header(default=None, alias="payment-signature"),
) -> Capability:
    """
    Download the full capability YAML payload.

    Without a valid payment-signature header, returns HTTP 402 with an x402
    challenge in the PAYMENT-REQUIRED header.
    """
    cap = registry.get(capability_id)
    if cap is None:
        raise HTTPException(status_code=404, detail="Capability not found")

    if not payment_signature:
        challenge = create_x402_challenge(cap.id, cap.price_usdc)
        raise HTTPException(
            status_code=402,
            detail="Payment required",
            headers={"PAYMENT-REQUIRED": encode_challenge(challenge)},
        )

    try:
        payload = decode_payment_signature(payment_signature)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid payment-signature header: {exc}") from exc

    ok, recovered = verify_payment_signature(payload)
    if not ok:
        raise HTTPException(status_code=402, detail="Payment signature verification failed")

    buyer = payload.payload.authorization.from_address
    settlement = await settle_with_facilitator(payload)
    entry = create_ledger_entry(
        capability_id=cap.id,
        buyer=buyer,
        seller=cap.attestation.auditor_address if cap.attestation else "0x000000000000000000000000000000000000ACE3",
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

    return Response(
        content=cap.model_dump_json(),
        media_type="application/json",
    )
