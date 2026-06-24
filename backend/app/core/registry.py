"""Capability registry: in-memory search and filtering."""

from app.schemas.capability import Capability


class CapabilityRegistry:
    """Simple in-memory registry backed by the database seed layer."""

    def __init__(self) -> None:
        self._capabilities: dict[str, Capability] = {}

    def register(self, capability: Capability) -> None:
        self._capabilities[capability.id] = capability

    def list_all(self) -> list[Capability]:
        return list(self._capabilities.values())

    def get(self, capability_id: str) -> Capability | None:
        return self._capabilities.get(capability_id)

    def find_matches(self, error_code: str | None, log_snippet: str | None) -> list[Capability]:
        """Return capabilities whose trigger signatures match the incident."""
        matches: list[Capability] = []
        for cap in self._capabilities.values():
            for trigger in cap.trigger_signatures:
                if error_code and trigger.error_code and error_code == trigger.error_code:
                    matches.append(cap)
                    break
                if log_snippet and trigger.terminal_log_pattern and trigger.terminal_log_pattern in log_snippet:
                    matches.append(cap)
                    break
        return matches


registry = CapabilityRegistry()
