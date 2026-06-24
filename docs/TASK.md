# Backend Agent Development Task Book

## Core Positioning

Agent Capability Exchange (ACE) lets AI agents make rational economic choices when facing unknown, high-risk, or expensive operational incidents: buy a cheap, cryptographically verified Capability Pack instead of burning tokens on live trial-and-error.

## Experience Compression Pipeline

1. **Runtime State Tracing** — capture state-machine transitions, tool calls, error payloads, retries and nonce changes.
2. **Graph Reduction** — strip environment-specific variables (session address, nonce, timestamp).
3. **Heuristic Compilation** — identify error-defense branches that lead to `Success` and serialize them as `decision_points` in YAML.
4. **Moat** — static LLMs know API specs but lack runtime failure feedback and the risk of asset lockout.

## Consumer Agent Logic

1. Estimate direct recovery cost: `C_direct = (T_in * P_in) + (T_out * P_out) + R_risk`.
2. Compare with Capability Pack price `C_pack`.
3. If `C_pack < C_direct` and attestation is valid, intercept HTTP 402, sign EIP-3009 authorization, unlock and execute YAML decision tree.

## Files of Note

- `app/config.py` — settings
- `app/core/registry.py` — capability search
- `app/core/cost.py` — ROI calculus
- `app/core/payment.py` — EIP-3009 envelope
- `app/agents/consumer_agent.py` — resolve / purchase / execute
- `app/agents/producer_agent.py` — capability generation stub
- `app/agents/auditor.py` — sign / verify attestations
