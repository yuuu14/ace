import type { TraceLine } from "@/lib/types";

/** Phase definitions — single source of truth for the agent observability tracker. */
export const phaseConfig = [
  { key: "incident", label: "Incident", sources: ["ACE Console", "Error"] as const, color: "rose" },
  { key: "reasoning", label: "Cost Model", sources: ["Calculus"] as const, color: "amber" },
  { key: "registry", label: "Market Match", sources: ["Lookup", "Match"] as const, color: "violet" },
  { key: "payment", label: "x402", sources: ["Payment"] as const, color: "cyan" },
  { key: "execution", label: "Execution", sources: ["Complete"] as const, color: "mint" },
] as const;

type PhaseColor = (typeof phaseConfig)[number]["color"];

/** Short source labels for the evidence stream. */
export const sourceLabels: Record<TraceLine["source"], string> = {
  "ACE Console": "FAULT",
  Calculus: "COST",
  Lookup: "SCAN",
  Match: "MATCH",
  Payment: "X402",
  Complete: "DONE",
  Error: "ERR",
};

/** Human-readable role label per source. */
export const sourceRoles: Record<TraceLine["source"], string> = {
  "ACE Console": "Fault Detection",
  Calculus: "Cost Model",
  Lookup: "Registry Scan",
  Match: "Market Match",
  Payment: "x402 Payment",
  Complete: "Execution",
  Error: "Error",
};

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                       */
/* ------------------------------------------------------------------ */

export function extractMoney(text: string): string[] {
  return text.match(/\$[0-9.]+/g) || [];
}

export function extractPercent(text: string): string[] {
  return text.match(/[0-9]+(?:\.[0-9]+)?%/g) || [];
}

/** Build contiguous groups of trace lines by phase key. */
export function buildPhaseGroups(lines: TraceLine[]) {
  return lines.reduce<
    Array<{ key: string; start: number; end: number; lines: TraceLine[] }>
  >((groups, line, index) => {
    const phase = phaseConfig.find((p) =>
      (p.sources as readonly string[]).includes(line.source),
    );
    const key = phase?.key || line.source;
    const prev = groups.at(-1);
    if (prev && prev.key === key) {
      prev.end = index;
      prev.lines.push(line);
    } else {
      groups.push({ key, start: index, end: index, lines: [line] });
    }
    return groups;
  }, []);
}

/** Generate phase summaries from visible lines. */
export function computePhaseStates(visibleLines: TraceLine[]) {
  return phaseConfig.map((phase, idx) => {
    const matched = visibleLines.filter((l) =>
      (phase.sources as readonly string[]).includes(l.source),
    );
    const active = matched.length > 0;
    const nextPhase = phaseConfig[idx + 1];
    const complete =
      active &&
      nextPhase
        ? visibleLines.some((l) =>
            (nextPhase.sources as readonly string[]).includes(l.source),
          )
        : false;
    return { ...phase, active, complete, count: matched.length };
  });
}

/* ------------------------------------------------------------------ */
/*  State classifier per group                                         */
/* ------------------------------------------------------------------ */

export interface StateCard {
  index: number;
  label: string;
  color: PhaseColor;
  title: string;
  summary: string;
  metric: string;
  next: string;
  source: TraceLine["source"];
}

export function classifyState(
  line: TraceLine,
  index: number,
  allLines: TraceLine[],
): StateCard {
  const phase = phaseConfig.find((p) =>
    (p.sources as readonly string[]).includes(line.source),
  );
  const color = phase?.color ?? "cyan";
  const allText = allLines.slice(0, index + 1).map((l) => l.text).join(" ");
  const money = extractMoney(allText);
  const pcts = extractPercent(allText);

  // Incident
  if (line.source === "ACE Console") {
    return {
      index,
      label: "Incident",
      color: "rose",
      title: "Fault signal captured",
      summary: "The consumer agent detected a Circle spend-limit lockout and froze direct execution.",
      metric: "Risk: asset operation blocked",
      next: "Estimate recovery cost before choosing a route.",
      source: line.source,
    };
  }

  // Cost model — DeepSeek output
  if (line.source === "Calculus" && line.text.includes("DeepSeek:")) {
    return {
      index,
      label: "Cost Model",
      color: "amber",
      title: "Live model triage",
      summary: line.text.replace("DeepSeek: ", ""),
      metric: "Provider: deepseek-v4-flash",
      next: "Use model output as advisory signal; keep deterministic checks authoritative.",
      source: line.source,
    };
  }

  // Cost model — direct cost estimate
  if (line.source === "Calculus" && line.text.includes("Estimated Direct Cost")) {
    return {
      index,
      label: "Cost Model",
      color: "amber",
      title: "Direct recovery priced",
      summary: "The agent estimated the cost of solving the incident through recursive trial-and-error.",
      metric: `Direct path: ${money[0] || "$0.0252"} USDC`,
      next: "Compare against marketplace capability price.",
      source: line.source,
    };
  }

  // Cost model — ROI decision
  if (line.source === "Calculus" && line.text.includes("ROI Decision")) {
    return {
      index,
      label: "Cost Model",
      color: "amber",
      title: "Purchase gate passed",
      summary: "The capability pack is cheaper than expected direct recovery and has a verified route.",
      metric: `Expected saving: ${pcts.at(-1) || "92%"}`,
      next: "Acquire the capability through x402 authorization.",
      source: line.source,
    };
  }

  // Cost model — generic
  if (line.source === "Calculus") {
    return {
      index,
      label: "Cost Model",
      color: "amber",
      title: "Cost model running",
      summary: "The agent is projecting token spend, latency, and lockout risk.",
      metric: "Inputs: incident + registry priors",
      next: "Search for a cheaper verified capability.",
      source: line.source,
    };
  }

  // Lookup
  if (line.source === "Lookup") {
    return {
      index,
      label: "Market Match",
      color: "violet",
      title: "Registry query issued",
      summary: "The agent is searching audited capability packs by trigger signature and incident context.",
      metric: "Search space: verified packs",
      next: "Rank candidates by fit, price, and provenance.",
      source: line.source,
    };
  }

  // Match
  if (line.source === "Match") {
    const capName = line.text.match(/'([^']+)'/)?.[1] || "matched capability";
    return {
      index,
      label: "Market Match",
      color: "violet",
      title: "Capability selected",
      summary: `The agent selected ${capName} as the cheapest verified recovery route.`,
      metric: `Pack price: ${money[0] || "$0.0020"} USDC`,
      next: "Unlock full decision tree after payment authorization.",
      source: line.source,
    };
  }

  // Payment — HTTP 402
  if (line.source === "Payment" && line.text.includes("HTTP 402")) {
    return {
      index,
      label: "x402",
      color: "cyan",
      title: "Paywall challenge received",
      summary: "The capability endpoint returned a structured x402 payment requirement.",
      metric: "Protocol: HTTP 402",
      next: "Decode accepted network, asset, recipient, and amount.",
      source: line.source,
    };
  }

  // Payment — signing
  if (line.source === "Payment" && line.text.includes("Signing")) {
    return {
      index,
      label: "x402",
      color: "cyan",
      title: "Off-chain authorization signing",
      summary: "The agent is signing EIP-712 typed data without sending a gas transaction.",
      metric: "Signature: TransferWithAuthorization",
      next: "Submit signed payload for settlement verification.",
      source: line.source,
    };
  }

  // Payment — accepted
  if (line.source === "Payment" && line.text.includes("Authorization accepted")) {
    return {
      index,
      label: "x402",
      color: "cyan",
      title: "Capability unlocked",
      summary: "The payment authorization was accepted and settlement evidence was recorded.",
      metric: "Ledger status: completed",
      next: "Execute the purchased recovery decision tree.",
      source: line.source,
    };
  }

  // Payment — generic
  if (line.source === "Payment") {
    return {
      index,
      label: "x402",
      color: "cyan",
      title: "Payment orchestration",
      summary: "The agent is progressing through the x402 authorization flow.",
      metric: "Asset: USDC on Arc testnet",
      next: "Complete settlement and download the capability.",
      source: line.source,
    };
  }

  // Complete
  if (line.source === "Complete") {
    return {
      index,
      label: "Execution",
      color: "mint",
      title: "Recovery path completed",
      summary: "The purchased decision tree resolved the wallet lockout without further trial-and-error.",
      metric: "Outcome: operational recovery",
      next: "Persist ledger and savings metrics for audit.",
      source: line.source,
    };
  }

  // Fallback
  return {
    index,
    label: phase?.label || line.source,
    color: color as PhaseColor,
    title: phase?.label || "Agent event",
    summary: line.text,
    metric: "Signal recorded",
    next: "Continue observing agent execution.",
    source: line.source,
  };
}

/* ------------------------------------------------------------------ */
/*  CSS class helpers (no side‑effects)                                 */
/* ------------------------------------------------------------------ */

export function dotBgClass(color: string): string {
  const m: Record<string, string> = {
    rose: "bg-rose-400",
    amber: "bg-amber-300",
    violet: "bg-violet-300",
    cyan: "bg-cyan-300",
    mint: "bg-emerald-300",
  };
  return m[color] ?? "bg-ace-cyan";
}

export function borderBgClass(color: string, active: boolean): string {
  if (!active) return "border-ace-border bg-black/30 text-zinc-500";
  const m: Record<string, string> = {
    rose: "border-rose-400/50 bg-rose-500/10 text-rose-200",
    amber: "border-amber-300/50 bg-amber-400/10 text-amber-100",
    violet: "border-violet-300/50 bg-violet-400/10 text-violet-100",
    cyan: "border-cyan-300/50 bg-cyan-400/10 text-cyan-100",
    mint: "border-emerald-300/50 bg-emerald-400/10 text-emerald-100",
  };
  return m[color] ?? "border-ace-cyan/50 bg-ace-cyan/10 text-zinc-100";
}

export function evidenceBorderClass(source: TraceLine["source"]): string {
  const m: Record<string, string> = {
    "ACE Console": "border-rose-400/30 bg-rose-500/10",
    Calculus: "border-amber-300/30 bg-amber-400/10",
    Lookup: "border-violet-300/25 bg-violet-400/5",
    Match: "border-violet-300/35 bg-violet-400/10",
    Payment: "border-cyan-300/35 bg-cyan-400/10",
    Complete: "border-emerald-300/35 bg-emerald-400/10",
    Error: "border-rose-400/40 bg-rose-500/15",
  };
  return m[source] ?? "border-ace-border bg-black/30";
}
