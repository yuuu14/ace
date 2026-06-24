"""Auditor Agent: sign and verify capability attestations."""

from app.config import settings
from app.core.crypto import recover_signer, sign_message
from app.schemas.capability import Capability


def sign_capability(cap: Capability, private_key_hex: str | None = None) -> Capability:
    """Sign a capability's provenance metrics and attach an attestation envelope."""
    from app.schemas.capability import Attestation
    from datetime import datetime, timezone

    message = cap.attest_message()
    signature = sign_message(message, private_key_hex=private_key_hex)
    cap.attestation = Attestation(
        auditor_address=private_key_hex or settings.AUDITOR_PRIVATE_KEY or "0x000000000000000000000000000000000000ACE1",
        timestamp=int(datetime.now(timezone.utc).timestamp()),
        signature=signature,
    )
    return cap


def verify_capability(cap: Capability) -> dict:
    """Verify that a capability's attestation signature recovers the claimed auditor."""
    if cap.attestation is None:
        return {"valid": False, "reason": "missing attestation"}

    if settings.is_demo_mode:
        return {"valid": True, "reason": "demo mode accepts mock signatures", "auditor": cap.attestation.auditor_address}

    message = cap.attest_message()
    recovered = recover_signer(message, cap.attestation.signature)
    if recovered is None:
        return {"valid": False, "reason": "signature recovery failed"}
    if recovered.lower() != cap.attestation.auditor_address.lower():
        return {"valid": False, "reason": "auditor mismatch", "recovered": recovered}
    return {"valid": True, "auditor": recovered}
