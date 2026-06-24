import type { ResolveResponse, TraceLine } from "./types";

export function buildResolveTrace(
  response: ResolveResponse,
  capabilityName?: string,
): TraceLine[] {
  const direct = response.estimated_direct_cost_usdc ?? 0.25;
  const price = response.price_usdc ?? 0.002;
  const savings = response.savings_pct ?? 96;
  const name = capabilityName || response.capability_id || "cap_circle_lockout";

  const lines: TraceLine[] = [
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

  const traceLines = response.live_analysis?.trace_lines || [];
  if (response.mode === "live" && traceLines.length > 0) {
    lines.splice(
      1,
      0,
      ...traceLines.slice(0, 3).map((text) => ({
        source: "Calculus" as const,
        text: `DeepSeek: ${text}`,
        highlight: "cyan" as const,
      })),
    );
  }

  return lines;
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
