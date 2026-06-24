"""Ledger endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import LedgerRecord
from app.schemas.payment import LedgerEntry

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("", response_model=list[LedgerEntry])
def list_ledger(db: Session = Depends(get_db)) -> list[LedgerEntry]:
    records = db.query(LedgerRecord).order_by(LedgerRecord.created_at.desc()).all()
    return [
        LedgerEntry(
            id=r.id,
            capability_id=r.capability_id,
            buyer=r.buyer,
            seller=r.seller,
            amount_usdc=r.amount_usdc,
            tx_hash=r.tx_hash,
            status=r.status,
            created_at=r.created_at,
            settled_at=r.settled_at,
        )
        for r in records
    ]


@router.get("/savings")
def total_savings() -> dict:
    """Return cumulative inferred savings based on settled ledger entries."""
    from app.core.cost import estimated_direct_cost_usdc
    from app.db import SessionLocal

    db = SessionLocal()
    try:
        settled = db.query(LedgerRecord).filter(LedgerRecord.status.in_(["settled", "completed"])).all()
        direct_cost = estimated_direct_cost_usdc()
        total_spent = sum(r.amount_usdc for r in settled)
        total_saved = sum(direct_cost - r.amount_usdc for r in settled)
        return {
            "settlements": len(settled),
            "total_spent_usdc": round(total_spent, 4),
            "total_saved_usdc": round(total_saved, 4),
            "reference_direct_cost_usdc": direct_cost,
        }
    finally:
        db.close()
