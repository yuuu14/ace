"use client";

import type { CapabilitySummary } from "@/lib/types";

interface Props {
  capability: CapabilitySummary;
  selected: boolean;
  onClick: () => void;
}

export default function CapabilityCard({ capability, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-ace-cyan bg-ace-cyan/10"
          : "border-ace-border bg-ace-panel hover:border-zinc-600"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold text-ace-cyan">{capability.category}</span>
        <span className="text-xs text-ace-mint">${capability.price_usdc.toFixed(4)} USDC</span>
      </div>
      <h3 className="mb-2 text-sm font-medium leading-snug text-zinc-100">{capability.objective}</h3>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-ace-muted">
        <div className="rounded bg-ace-bg/60 px-2 py-1">
          Chaos Tests: <span className="text-white">{capability.sample_runs_analyzed}</span>
        </div>
        <div className="rounded bg-ace-bg/60 px-2 py-1">
          Speedup: <span className="text-white">{capability.average_latency_reduction_pct}%</span>
        </div>
        <div className="col-span-2 rounded bg-ace-bg/60 px-2 py-1">
          Inference Cost: <span className="text-ace-mint">-{capability.direct_token_saving_pct}%</span>
        </div>
      </div>
    </button>
  );
}
