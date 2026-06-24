"""Pydantic models for capability packs and registry responses."""

from pydantic import BaseModel, Field


class DecisionPoint(BaseModel):
    condition: str
    action: str
    failsafe: str | None = None
    params: dict | None = None
    security_policy: str | None = None


class TriggerSignature(BaseModel):
    error_code: str | None = None
    terminal_log_pattern: str | None = None


class ProvenanceMetrics(BaseModel):
    experience_sources: list[str] = Field(default_factory=list)
    sample_runs_analyzed: int = 0
    average_latency_reduction_pct: float = 0.0
    direct_token_saving_pct: float = 0.0


class Attestation(BaseModel):
    auditor_address: str
    timestamp: int
    signature: str


class Capability(BaseModel):
    id: str
    version: str
    objective: str
    category: str
    price_usdc: float = 0.0
    trigger_signatures: list[TriggerSignature] = Field(default_factory=list)
    provenance_metrics: ProvenanceMetrics = Field(default_factory=ProvenanceMetrics)
    decision_points: list[DecisionPoint] = Field(default_factory=list)
    attestation: Attestation | None = None

    def attest_message(self) -> str:
        """Deterministic message consumed by the auditor signer."""
        metrics = self.provenance_metrics
        return (
            f"capability:{self.id}:"
            f"runs={metrics.sample_runs_analyzed}:"
            f"latency_reduction={metrics.average_latency_reduction_pct}:"
            f"token_saving={metrics.direct_token_saving_pct}"
        )


class CapabilitySummary(BaseModel):
    id: str
    objective: str
    category: str
    price_usdc: float
    sample_runs_analyzed: int
    average_latency_reduction_pct: float
    direct_token_saving_pct: float
    auditor_address: str | None = None
