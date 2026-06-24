# ACE — Agent Capability Exchange

ACE is a hackathon demo for an agent-native marketplace where AI agents buy
verified operational experience instead of repeatedly rediscovering solutions
through expensive, high-risk trial-and-error reasoning.

In the demo, a Consumer Agent hits a simulated stablecoin wallet lockout, prices
the direct recovery path, finds an audited Capability Pack, unlocks it through an
x402-style USDC nanopayment, and executes the recovery decision tree.

The dashboard presents the run as an agent observability cockpit: phase
timeline, ROI decision matrix, capability route, x402 settlement status, and a
compact evidence stream.

## Why It Matters

LLMs know public API documentation, but they do not automatically inherit the
runtime scars of real incidents: nonce races, spend-limit lockouts, retry
ordering, flaky RPCs, or settlement edge cases. ACE turns those operational
traces into small, auditable Capability Packs that another agent can buy for far
less than the expected cost of trial-and-error recovery.

The hackathon wedge is:

- **Experience compression:** raw traces become reusable YAML decision points.
- **Economic routing:** the agent buys only when pack price is below expected
  direct recovery cost.
- **Cryptographic provenance:** packs carry auditor attestations and x402
  payment records.
- **Live reasoning option:** in live mode, DeepSeek ranks matching packs and
  explains the decision while deterministic checks still enforce safety.

## Project Structure

```text
ace/
├── backend/      FastAPI + SQLite + agent orchestration
├── frontend/     Next.js 15 + Tailwind 4 dashboard
├── docs/         Task, design, pitch, demo and FAQ docs
└── README.md     This file
```

## Demo Flow

1. Open the dashboard.
2. Click **Inject simulated lockout**.
3. Watch the Consumer Agent estimate direct recovery cost.
4. The registry searches multiple audited packs and selects the Circle wallet
   recovery capability.
5. The paywall returns HTTP 402 with a `PAYMENT-REQUIRED` challenge.
6. The agent submits an EIP-712 `TransferWithAuthorization` payload.
7. The pack is unlocked, the decision tree executes, and the ledger/savings
   panels update.

## Quick Start

### Backend

```bash
cd /Users/elias/Developer/yuuu14/ace/backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd /Users/elias/Developer/yuuu14/ace/frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3002`.

## Environment Modes

Copy the backend environment file before running outside this workspace:

```bash
cd /Users/elias/Developer/yuuu14/ace/backend
cp .env.example .env
```

Important backend variables:

| Variable | Purpose |
| --- | --- |
| `ACE_MODE` | `demo` skips external settlement; `live` enables DeepSeek analysis and strict EIP-712 signature verification. |
| `LLM_API_KEY` | DeepSeek/OpenAI-compatible API key. Keep this local; never commit real keys. |
| `LLM_BASE_URL` | Defaults to `https://api.deepseek.com/v1`. |
| `LLM_MODEL` | Defaults to `deepseek-chat`. |
| `CONSUMER_PRIVATE_KEY` | Optional test wallet key for signing payment payloads. If omitted, ACE uses a deterministic demo key for local live-mode verification. |
| `X402_SETTLEMENT_MODE` | `demo` records a local settlement; `facilitator` posts to Circle's x402 facilitator. |
| `CIRCLE_FACILITATOR_URL` | Circle x402 facilitator endpoint used when external settlement is enabled. |

This repo keeps `.env` ignored. The included `.env.example` is safe to commit;
real secrets should stay local.

## Nanopayment Flow

ACE uses the **Circle x402** protocol (HTTP 402 Payment Required) with **EIP-712**
`TransferWithAuthorization` signing:

1. `GET /capabilities/{id}/download` returns **HTTP 402** with a base64
   `PAYMENT-REQUIRED` challenge.
2. The buyer builds EIP-712 typed data scoped to the Circle GatewayWallet contract
   on Arc Testnet (chainId `5042002`).
3. The buyer signs off-chain and resubmits the request with a `payment-signature`
   header.
4. The backend verifies the signature and, in live mode, can forward the
   authorization to Circle's facilitator for batched settlement.

Demo mode accepts mock signatures so the dashboard works without real private keys.

For the hackathon dashboard, the browser first requests the x402 challenge from
`GET /capabilities/{id}/download`. If no wallet signer is injected, it asks
`POST /agent/purchase/{id}` for a server-generated EIP-712 payload so the local
live environment can still complete the flow end-to-end.

Live DeepSeek reasoning works with `ACE_MODE=live`. Real blockchain settlement
requires Arc testnet keys plus `X402_SETTLEMENT_MODE=facilitator`; otherwise the
app records a local settlement so the hackathon demo remains reliable.

## API Surface

- `GET /health` — backend health check.
- `GET /runtime` — current mode, LLM provider/model, and chain id.
- `GET /capabilities` — public Capability Pack summaries.
- `GET /capabilities/{id}` — public metadata and decision-tree preview.
- `GET /capabilities/{id}/download` — paywalled full capability download.
- `POST /agent/resolve` — Consumer Agent ROI decision loop.
- `POST /agent/purchase/{id}` — emit x402 challenge plus signed demo payload.
- `GET /ledger` — nanopayment settlement records.
- `GET /ledger/savings` — aggregate spend/savings metrics.

## Verification

Useful checks before presenting:

```bash
cd /Users/elias/Developer/yuuu14/ace/backend
uv run python -m compileall app
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd /Users/elias/Developer/yuuu14/ace/frontend
npm run typecheck
npm run build
```

## Hackathon Pitch

ACE reframes agent reliability as a market: agents do not need to be infinitely
smart in isolation; they need a way to buy trusted, compressed experience from
agents that already survived the failure. The demo shows that loop with a
stablecoin wallet incident, x402-style payment, auditable provenance, and a
clear ROI calculation.

The seeded marketplace currently includes five packs across recovery, RPC,
payment, compliance, and governance failure modes.

## License

MIT
