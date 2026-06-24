"""Pydantic models for nanopayment flows and ledger entries."""

from datetime import datetime

from pydantic import BaseModel, Field


class EIP712Authorization(BaseModel):
    from_address: str = Field(serialization_alias="from", validation_alias="from")
    to_address: str = Field(serialization_alias="to", validation_alias="to")
    value: str
    validAfter: str
    validBefore: str
    nonce: str

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class EIP712Payload(BaseModel):
    signature: str
    authorization: EIP712Authorization


class X402Accept(BaseModel):
    network: str
    scheme: str
    asset: str
    amount: str
    payTo: str
    maxTimeoutSeconds: int
    extra: dict = Field(default_factory=dict)


class X402Challenge(BaseModel):
    x402Version: int = 2
    resource: str
    accepts: list[X402Accept]


class PaymentSignaturePayload(BaseModel):
    x402Version: int = 2
    payload: EIP712Payload
    accepted: dict
    resource: str


class X402Settlement(BaseModel):
    settlement_id: str
    status: str
    tx_hash: str | None = None


class PaymentChallenge(BaseModel):
    amount_usdc: float
    recipient: str
    chain_id: int
    token_contract: str | None = None
    memo: str | None = None


class LedgerEntry(BaseModel):
    id: int | None = None
    capability_id: str
    buyer: str
    seller: str
    amount_usdc: float
    tx_hash: str | None = None
    status: str  # "pending", "settled", "failed"
    created_at: datetime | None = None
    settled_at: datetime | None = None
