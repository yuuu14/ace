"""Agent resolution and payment endpoints."""

from fastapi import APIRouter, Header, HTTPException

from app.agents.consumer_agent import (
    find_matching_capabilities,
    purchase_capability,
    resolve_incident,
    settle_and_execute,
)
from app.schemas.incident import ResolveRequest, ResolveResponse

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/resolve", response_model=ResolveResponse)
def resolve(request: ResolveRequest) -> ResolveResponse:
    return resolve_incident(request)


@router.post("/purchase/{capability_id}")
def purchase(capability_id: str) -> dict:
    try:
        return purchase_capability(capability_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/execute/{capability_id}")
async def execute(
    capability_id: str,
    payment_signature: str | None = Header(default=None, alias="payment-signature"),
    context: dict | None = None,
) -> dict:
    if not payment_signature:
        raise HTTPException(status_code=402, detail="payment-signature header required")
    try:
        return await settle_and_execute(capability_id, payment_signature, context or {})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/matches")
def matches(error_code: str | None = None, log_snippet: str | None = None) -> list[dict]:
    from app.schemas.incident import Incident
    summaries = find_matching_capabilities(Incident(error_code=error_code, log_snippet=log_snippet))
    return [s.model_dump() for s in summaries]
