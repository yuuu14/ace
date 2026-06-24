"""ECDSA signing and recovery utilities (demo/live aware)."""

import hashlib

from app.config import settings


def _mock_sign(message: str, private_key_hex: str) -> str:
    """Deterministic fake signature for demo mode."""
    payload = f"{private_key_hex}:{message}".encode()
    return "0x" + hashlib.sha256(payload).hexdigest()[:128]


def sign_message(message: str, private_key_hex: str | None = None) -> str:
    """Sign an attestation message. Demo mode returns a deterministic mock."""
    key = private_key_hex or settings.AUDITOR_PRIVATE_KEY or "0x" + "00" * 32
    if settings.is_demo_mode:
        return _mock_sign(message, key)

    try:
        from eth_account import Account
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("eth-account is required for live signing") from exc

    account = Account.from_key(key)
    return account.sign_message(message).signature.hex()


def recover_signer(message: str, signature: str) -> str | None:
    """Recover the signer address from a message and signature."""
    if settings.is_demo_mode:
        return None

    try:
        from eth_account import Account
    except ImportError:  # pragma: no cover
        return None

    try:
        return Account.recover_message(message, signature=signature)
    except Exception:  # pragma: no cover
        return None
