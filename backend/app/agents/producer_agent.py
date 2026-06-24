"""Producer Agent: demo capability generator (experience compression pipeline)."""

from datetime import datetime, timezone

from app.config import settings
from app.core.crypto import sign_message
from app.schemas.capability import Attestation, Capability, DecisionPoint, ProvenanceMetrics, TriggerSignature


def _default_capability(capability_id: str = "cap_circle_lockout_recovery") -> Capability:
    return Capability(
        id=capability_id,
        version="1.0.0",
        objective="Recover and reset Circle wallet spending limits under OTP-dropped concurrency lockouts",
        category="RECOVERY",
        price_usdc=0.0020,
        trigger_signatures=[
            TriggerSignature(error_code="402_LIMIT_EXCEEDED"),
            TriggerSignature(terminal_log_pattern="Error: CLI execution limit exceeded on stablecoin transfer"),
        ],
        provenance_metrics=ProvenanceMetrics(
            experience_sources=["chaos_test_runs", "replayed_failure_scenarios"],
            sample_runs_analyzed=15,
            average_latency_reduction_pct=88.0,
            direct_token_saving_pct=96.0,
        ),
        decision_points=[
            DecisionPoint(
                condition="wallet_status == SESSION_LOCKED",
                action="fetch_monotonic_nonce",
                failsafe="reset_local_nonce_to_onchain",
            ),
            DecisionPoint(
                condition="last_execution_error == invalid_nonce",
                action="force_sync_block_header",
            ),
            DecisionPoint(
                condition="transaction_dropped == true",
                action="sequence_traverse_fallback_rpc",
            ),
            DecisionPoint(
                condition="spend_limit_exceeded == true",
                action="generate_limit_reset_policy",
                params={"per_tx": 1, "daily": 5},
                security_policy="delegate_otp_to_admin_without_storing_in_agent_memory",
            ),
        ],
        attestation=Attestation(
            auditor_address="0x000000000000000000000000000000000000ACE1",
            timestamp=int(datetime.now(timezone.utc).timestamp()),
            signature="",
        ),
    )


def generate_capability(
    capability_id: str = "cap_circle_lockout_recovery",
    auditor_key: str | None = None,
) -> Capability:
    """
    Produce a capability pack and sign its attestation.

    In a full implementation this would run the experience compression pipeline
    (state tracing, graph reduction, heuristic compilation). Here we return a
    deterministic demo pack so the marketplace is immediately usable.
    """
    cap = _default_capability(capability_id)
    message = cap.attest_message()
    cap.attestation.signature = sign_message(message, private_key_hex=auditor_key) if auditor_key else sign_message(message)
    return cap


def compress_experience(
    trace_logs: list[dict],
    objective: str,
    category: str,
) -> Capability:
    """Stub for the full experience compression pipeline."""
    return generate_capability()
