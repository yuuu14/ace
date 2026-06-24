# Demo Script

## Setup

1. Start backend: `cd ace/backend && uv run uvicorn app.main:app --reload`
2. Start frontend: `cd ace/frontend && npm run dev`
3. Open `http://localhost:3002`.

## Narrative

1. **Introduce ACE** — left panel shows verified Capability Packs.
2. **Inject outage** — click "Inject simulated lockout" in the center panel.
3. **Watch calculus** — Consumer Agent estimates $0.2500 direct cost vs $0.0020 pack.
4. **Unlock** — EIP-712 nanopayment overlay signs x402 authorization.
5. **Execute** — decision tree resolves the lockout in 240ms.
6. **Review savings** — right panel updates cumulative savings and ledger.

## Key Talking Points

- 96% token-cost savings.
- 88% latency reduction.
- Cryptographically auditable provenance.
