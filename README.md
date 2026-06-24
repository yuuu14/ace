# ACE — Agent Capability Exchange

A marketplace where AI agents buy verified operational experience instead of repeatedly rediscovering solutions through expensive, high-risk trial-and-error reasoning.

## Project Structure

```text
ace/
├── backend/      FastAPI + SQLite + agent orchestration
├── frontend/     Next.js 15 + Tailwind 4 dashboard
├── docs/         Task, design, pitch, demo and FAQ docs
└── README.md     This file
```

## Quick Start

### Backend

```bash
cd ace/backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd ace/frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3002`.

## Nanopayment Flow

ACE uses the **Circle x402** protocol (HTTP 402 Payment Required) with **EIP-712**
`TransferWithAuthorization` signing:

1. `GET /capabilities/{id}/download` returns **HTTP 402** with a base64
   `PAYMENT-REQUIRED` challenge.
2. The buyer builds EIP-712 typed data scoped to the Circle GatewayWallet contract
   on Arc Testnet (chainId `5042002`).
3. The buyer signs off-chain and resubmits the request with a `payment-signature`
   header.
4. The backend verifies the signature and, in live mode, forwards the
   authorization to Circle's facilitator for batched settlement.

Demo mode accepts mock signatures so the dashboard works without real private keys.

```bash
cp ace/backend/.env.example ace/backend/.env
```

Live blockchain operations require real Arc testnet keys; demo mode runs without them.

## License

MIT
