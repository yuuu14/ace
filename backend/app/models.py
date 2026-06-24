"""SQLAlchemy ORM models for capabilities and ledger."""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, Text

from app.db import Base


class CapabilityRecord(Base):
    __tablename__ = "capabilities"

    id = Column(String, primary_key=True, index=True)
    version = Column(String, nullable=False)
    objective = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    price_usdc = Column(Float, nullable=False, default=0.0)
    yaml_blob = Column(Text, nullable=False)
    attestation_signature = Column(Text, nullable=True)


class LedgerRecord(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)
    capability_id = Column(String, nullable=False, index=True)
    buyer = Column(String, nullable=False)
    seller = Column(String, nullable=False)
    amount_usdc = Column(Float, nullable=False)
    tx_hash = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    settled_at = Column(DateTime, nullable=True)
