import type { TraceLine } from "./types";

export function buildResolveTrace(
  response: {
    estimated_direct_cost_usdc: number | null;
    capability_id: string | null;
    price_usdc: number | null;
    savings_pct: number | null;
    accepted: boolean;
    message: string;
  },
  capabilityName?: string,
): TraceLine[] {
  const direct = response.estimated_direct_cost_usdc ?? 0.25;
  const price = response.price_usdc ?? 0.002;
  const savings = response.savings_pct ?? 96;
  const name = capabilityName || response.capability_id || "cap_circle_lockout";

  return [
    {
      source: "ACE Console",
      text: "CRITICAL: Spender wallet hit spend limit threshold. API transaction aborted.",
      highlight: "rose",
    },
    { source: "Calculus", text: "Projecting direct trial-and-error recovery cost..." },
    {
      source: "Calculus",
      text: `Tokens needed: 120,000 recursive prompts. Key Lockout Risk: HIGH. Estimated Direct Cost: ~$${direct.toFixed(4)} USDC.`,
    },
    { source: "Lookup", text: "Searching ACE Registry for verified capability playbooks..." },
    {
      source: "Match",
      text: `Found '${name}' at $${price.toFixed(4)} USDC. Audited on 15 chaos test runs.`,
      highlight: "cyan",
    },
    {
      source: "Calculus",
      text: `ROI Decision: $${price.toFixed(4)} < ~$${direct.toFixed(4)} USDC. Expected Cost Saved: ${savings}%. Execution Risk: Reduced. ${
        response.accepted ? "SECURE PATH CONFIRMED. Action: PURCHASE." : response.message
      }`,
      highlight: response.accepted ? "mint" : "rose",
    },
  ];
}

export function buildPaymentTrace(): TraceLine[] {
  return [
    { source: "Payment", text: "Server returned HTTP 402 (Payment Required).", highlight: "rose" },
    {
      source: "Payment",
      text: "Generating EIP-3009 Gas-Free Offline Signature via Circle Gateway...",
      highlight: "cyan",
    },
    { source: "Payment", text: "Authorization accepted. Nanopayment settled off-chain.", highlight: "mint" },
    { source: "Payment", text: "Downloading YAML decision tree..." },
  ];
}

export function buildExecutionTrace(): TraceLine[] {
  return [
    {
      source: "ACE Console",
      text: "Executing Step 1 -> invalid_nonce encountered -> Syncing nonce from Arc on-chain state...",
    },
    {
      source: "ACE Console",
      text: "Executing Step 2 -> transaction_dropped == true -> Sequencing fallback RPC...",
    },
    {
      source: "ACE Console",
      text: "Executing Step 3 -> spend_limit_exceeded == true -> Generating limit reset policy...",
    },
    {
      source: "Complete",
      text: "Spend limit restrictions safely reset. Circle wallet active. Recovery path generated in 240ms.",
      highlight: "mint",
    },
  ];
}
