"""x402 / EIP-712 nanopayment orchestration aligned with ScrobblePay."""

from __future__ import annotations

import base64
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings
from app.schemas.payment import (
    EIP712Authorization,
    LedgerEntry,
    PaymentSignaturePayload,
    X402Accept,
    X402Challenge,
    X402Settlement,
)


def usdc_to_atomic(amount_usdc: float) -> int:
    """Convert decimal USDC to atomic units (6 decimals)."""
    return int(amount_usdc * 10**settings.USDC_DECIMALS)


def atomic_to_usdc(amount_atomic: int) -> float:
    return amount_atomic / 10**settings.USDC_DECIMALS


def create_x402_challenge(capability_id: str, amount_usdc: float) -> X402Challenge:
    """Build an x402 v2 PAYMENT-REQUIRED challenge for a capability."""
    amount_atomic = usdc_to_atomic(amount_usdc)
    return X402Challenge(
        x402Version=2,
        resource=f"ace://capabilities/{capability_id}",
        accepts=[
            X402Accept(
                network=f"eip155:{settings.ARC_CHAIN_ID}",
                scheme="exact",
                asset="USDC",
                amount=str(amount_atomic),
                payTo=settings.SELLER_ADDRESS,
                maxTimeoutSeconds=300,
                extra={
                    "verifyingContract": settings.GATEWAY_WALLET_CONTRACT,
                    "token": settings.USDC_CONTRACT,
                },
            )
        ],
    )


def encode_challenge(challenge: X402Challenge) -> str:
    """Base64-encode the challenge for the PAYMENT-REQUIRED header."""
    payload = challenge.model_dump_json().encode("utf-8")
    return base64.b64encode(payload).decode("ascii")


def decode_payment_signature(header: str) -> PaymentSignaturePayload:
    """Decode the base64 payment-signature header."""
    decoded = base64.b64decode(header).decode("utf-8")
    return PaymentSignaturePayload.model_validate_json(decoded)


def build_eip712_typed_data(accepted: X402Accept, buyer: str) -> dict[str, Any]:
    """Build EIP-712 typed data for TransferWithAuthorization."""
    chain_id = int(accepted.network.split(":")[1])
    now = int(time.time())
    valid_after = str(now - 600)
    valid_before = str(now + max(accepted.maxTimeoutSeconds, 7 * 24 * 3600 + 600))
    nonce = "0x" + secrets.token_hex(32)
    return {
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "TransferWithAuthorization": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "validAfter", "type": "uint256"},
                {"name": "validBefore", "type": "uint256"},
                {"name": "nonce", "type": "bytes32"},
            ],
        },
        "primaryType": "TransferWithAuthorization",
        "domain": {
            "name": "GatewayWalletBatched",
            "version": "1",
            "chainId": chain_id,
            "verifyingContract": accepted.extra["verifyingContract"],
        },
        "message": {
            "from": buyer,
            "to": accepted.payTo,
            "value": accepted.amount,
            "validAfter": valid_after,
            "validBefore": valid_before,
            "nonce": nonce,
        },
    }


def sign_typed_data(typed_data: dict[str, Any], private_key: str) -> str:
    """Sign EIP-712 typed data with eth-account."""
    from eth_account import Account

    account = Account.from_key(private_key)
    return account.sign_typed_data(full_message=typed_data).signature.hex()


def build_demo_signature_payload(accepted: X402Accept, buyer: str) -> PaymentSignaturePayload:
    """Create a payment-signature payload using a demo signer."""
    typed_data = build_eip712_typed_data(accepted, buyer)
    private_key = settings.CONSUMER_PRIVATE_KEY or ("0x" + "11" * 32)
    signature = sign_typed_data(typed_data, private_key)
    auth = EIP712Authorization(
        from_address=buyer,
        to_address=accepted.payTo,
        value=accepted.amount,
        validAfter=typed_data["message"]["validAfter"],
        validBefore=typed_data["message"]["validBefore"],
        nonce=typed_data["message"]["nonce"],
    )
    return PaymentSignaturePayload(
        x402Version=2,
        payload={"signature": signature, "authorization": auth.model_dump()},
        accepted=accepted.model_dump(),
        resource=f"ace://capabilities/demo",
    )


def recover_signer(typed_data: dict[str, Any], signature: str) -> str | None:
    """Recover the signer address from an EIP-712 signature."""
    from eth_account import Account

    try:
        return Account.recover_typed_data(full_message=typed_data, signature=signature)
    except Exception:
        return None


def verify_payment_signature(payload: PaymentSignaturePayload) -> tuple[bool, str | None]:
    """Verify that the signature recovers the authorization's from address."""
    if settings.is_demo_mode:
        return True, payload.payload.authorization.from_address

    accepted = X402Accept.model_validate(payload.accepted)
    buyer = payload.payload.authorization.from_address
    typed_data = build_eip712_typed_data(accepted, buyer)

    # Patch the typed data to use the submitted timestamps and nonce
    typed_data["message"]["validAfter"] = payload.payload.authorization.validAfter
    typed_data["message"]["validBefore"] = payload.payload.authorization.validBefore
    typed_data["message"]["nonce"] = payload.payload.authorization.nonce

    recovered = recover_signer(typed_data, payload.payload.signature)
    if recovered is None:
        return False, None
    if recovered.lower() != buyer.lower():
        return False, recovered
    return True, recovered


async def settle_with_facilitator(payload: PaymentSignaturePayload) -> X402Settlement:
    """Submit the signed authorization to Circle's x402 facilitator."""
    if settings.is_demo_mode:
        return X402Settlement(
            settlement_id="demo-" + secrets.token_hex(8),
            status="completed",
            tx_hash="0x" + secrets.token_hex(32),
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.CIRCLE_FACILITATOR_URL}/v1/x402/settle",
            json=payload.model_dump(),
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()
        return X402Settlement(
            settlement_id=data.get("id", data.get("settlementId", "unknown")),
            status=data.get("status", "pending"),
            tx_hash=data.get("transactionHash"),
        )


def create_ledger_entry(
    capability_id: str,
    buyer: str,
    seller: str,
    amount_usdc: float,
    settlement: X402Settlement | None = None,
) -> LedgerEntry:
    now = datetime.now(timezone.utc)
    return LedgerEntry(
        capability_id=capability_id,
        buyer=buyer,
        seller=seller,
        amount_usdc=amount_usdc,
        tx_hash=settlement.tx_hash if settlement else "0x" + secrets.token_hex(32),
        status=settlement.status if settlement else "settled",
        created_at=now,
        settled_at=now if settlement and settlement.status == "completed" else None,
    )
