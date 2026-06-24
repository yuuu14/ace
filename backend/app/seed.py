"""Seed the registry and database from YAML data files."""

from pathlib import Path

import yaml

from app.config import settings
from app.core.registry import registry
from app.db import SessionLocal, engine, Base
from app.models import CapabilityRecord
from app.schemas.capability import Capability


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SEED_FILE = DATA_DIR / "seed_capabilities.yaml"


def load_capabilities(path: Path = SEED_FILE) -> list[Capability]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    caps = raw.get("capabilities", raw.get("capability", raw)) if isinstance(raw, dict) else raw
    if isinstance(caps, dict):
        caps = [caps]
    return [Capability.model_validate(c) for c in caps]


def seed_registry() -> list[Capability]:
    capabilities = load_capabilities()
    for cap in capabilities:
        registry.register(cap)
    return capabilities


def seed_database() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for cap in load_capabilities():
            existing = db.query(CapabilityRecord).filter_by(id=cap.id).first()
            if existing:
                continue
            record = CapabilityRecord(
                id=cap.id,
                version=cap.version,
                objective=cap.objective,
                category=cap.category,
                price_usdc=cap.price_usdc,
                yaml_blob=cap.model_dump_json(),
                attestation_signature=cap.attestation.signature if cap.attestation else None,
            )
            db.add(record)
        db.commit()
    finally:
        db.close()


def seed_all() -> None:
    seed_registry()
    seed_database()


if __name__ == "__main__":
    seed_all()
    print(f"Seeded {len(registry.list_all())} capabilities")
