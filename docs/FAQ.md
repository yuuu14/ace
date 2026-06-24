# FAQ

## Why not just use Claude / RAG?

RAG retrieves static documentation. ACE retrieves *runtime-proven* decision trees with economic guarantees and cryptographic attestations.

## Is this only for Circle wallets?

No. Circle lockout recovery is the demo scenario. The same pattern applies to any agent-executable operational task.

## What happens in live mode?

Live mode uses real private keys, Arc RPC, and the Circle x402 facilitator for batched USDC settlement. Demo mode accepts mock signatures and records synthetic ledger entries.

## How are attestations verified?

The auditor signs a deterministic message derived from the capability's provenance metrics. Consumers verify via ECDSA recovery.

## Why x402 and EIP-712?

The Circle x402 protocol turns HTTP 402 responses into a standard payment challenge. EIP-712 `TransferWithAuthorization` lets the buyer sign a USDC transfer off-chain; the merchant forwards the signed authorization to Circle's facilitator, which batches many payments into a single on-chain `submitBatch` transaction. This eliminates per-call gas costs and is ideal for agent-to-agent nanopayments.

## How does ACE's payment implementation compare to ScrobblePay?

ACE reuses the same x402/EIP-712 pattern proven in ScrobblePay:

- Same Arc Testnet chainId (`5042002`).
- Same Circle facilitator URL: `https://gateway-api-testnet.circle.com`.
- Same GatewayWallet contract: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`.
- Same `payment-signature` header carrying `{ x402Version, payload: { signature, authorization }, accepted, resource }`.

The difference is that ACE is implemented in FastAPI instead of Express, and the paywalled resource is a Capability Pack YAML payload rather than a hello-world endpoint.
