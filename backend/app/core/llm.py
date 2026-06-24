"""Live LLM reasoning for incident triage."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.config import settings
from app.schemas.capability import Capability
from app.schemas.incident import Incident


def _extract_json(text: str) -> dict[str, Any] | None:
    """Parse a JSON object from model output, tolerating fenced responses."""
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            return None
        try:
            value = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
        return value if isinstance(value, dict) else None


def _candidate_payload(capabilities: list[Capability]) -> list[dict[str, Any]]:
    return [
        {
            "id": cap.id,
            "objective": cap.objective,
            "category": cap.category,
            "price_usdc": cap.price_usdc,
            "trigger_signatures": [signature.model_dump() for signature in cap.trigger_signatures],
            "provenance_metrics": cap.provenance_metrics.model_dump(),
            "decision_points": [point.model_dump() for point in cap.decision_points],
            "auditor_address": cap.attestation.auditor_address if cap.attestation else None,
        }
        for cap in capabilities
    ]


def analyze_incident_with_llm(
    incident: Incident,
    candidates: list[Capability],
    estimated_direct_cost_usdc: float,
) -> dict[str, Any] | None:
    """Ask the configured OpenAI-compatible model to rank capability candidates.

    The result is advisory. Deterministic price, registry, and signature checks
    remain the source of truth for purchasing.
    """
    if not settings.is_live_mode or not settings.LLM_API_KEY:
        return None

    prompt = {
        "incident": incident.model_dump(),
        "estimated_direct_cost_usdc": estimated_direct_cost_usdc,
        "candidates": _candidate_payload(candidates),
        "output_contract": {
            "summary": "one sentence incident diagnosis",
            "recommended_capability_id": "candidate id or null",
            "confidence": "number from 0 to 1",
            "direct_cost_adjustment_usdc": "optional positive number if risk changes the estimate",
            "rationale": "short reason suitable for a demo trace",
            "trace_lines": ["up to three concise console lines"],
        },
    }

    try:
        response = httpx.post(
            f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.LLM_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are ACE's live Consumer Agent. Rank verified incident-recovery "
                            "capability packs by operational fit and economic risk. Return JSON only."
                        ),
                    },
                    {"role": "user", "content": json.dumps(prompt, separators=(",", ":"))},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
            timeout=20.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
    except Exception as exc:
        return {
            "summary": "Live LLM analysis unavailable; deterministic registry matching used.",
            "recommended_capability_id": candidates[0].id if candidates else None,
            "confidence": 0,
            "rationale": str(exc),
            "trace_lines": ["DeepSeek live analysis failed closed; using verified local rules."],
            "error": type(exc).__name__,
        }

    analysis = _extract_json(content)
    if analysis is None:
        return {
            "summary": "Live LLM returned an unparsable response; deterministic registry matching used.",
            "recommended_capability_id": candidates[0].id if candidates else None,
            "confidence": 0,
            "rationale": content[:240],
            "trace_lines": ["DeepSeek response could not be parsed; using verified local rules."],
            "error": "JSONParseError",
        }

    return analysis
