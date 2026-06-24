"""Pydantic models for incident reports and agent resolution requests."""

from pydantic import BaseModel, Field


class Incident(BaseModel):
    error_code: str | None = None
    log_snippet: str | None = None
    service: str = "unknown"
    metadata: dict = Field(default_factory=dict)


class ResolveRequest(BaseModel):
    incident: Incident
    max_price_usdc: float | None = None
    trusted_auditors: list[str] = Field(default_factory=list)


class ResolveResponse(BaseModel):
    accepted: bool
    capability_id: str | None = None
    price_usdc: float | None = None
    estimated_direct_cost_usdc: float | None = None
    savings_pct: float | None = None
    decision_points: list[dict] | None = None
    message: str
