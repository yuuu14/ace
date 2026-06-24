"use client";

import type { CapabilitySummary } from "@/lib/types";

interface Props {
  capability: CapabilitySummary;
  selected: boolean;
  onClick: () => void;
}

const categoryStyles: Record<string, { label: string; item: string; bar: string }> = {
  RECOVERY: { label: "text-rose-200 bg-rose-500/10 border-rose-400/30", item: "", bar: "from-rose-400 to-amber-300" },
  RPC: { label: "text-amber-100 bg-amber-400/10 border-amber-300/30", item: "", bar: "from-amber-300 to-cyan-300" },
  PAYMENT: { label: "text-cyan-100 bg-cyan-400/10 border-cyan-300/30", item: "", bar: "from-cyan-300 to-blue-400" },
  COMPLIANCE: { label: "text-violet-100 bg-violet-400/10 border-violet-300/30", item: "", bar: "from-violet-300 to-fuchsia-300" },
};
const defaultStyle = { label: "text-emerald-100 bg-emerald-400/10 border-emerald-300/30", item: "", bar: "from-emerald-300 to-lime-300" };

export default function CapabilityCard({ capability, selected, onClick }: Props) {
  const reliability = Math.round(
    (capability.average_latency_reduction_pct + capability.direct_token_saving_pct) / 2,
  );
  const s = categoryStyles[capability.category] ?? defaultStyle;

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${capability.category} pack: ${capability.objective}. Price ${capability.price_usdc} USDC. Reliability ${reliability}%.`}
      className={`min-w-0 w-full rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-ace-cyan bg-ace-cyan/10 shadow-[0_0_24px_rgba(6,182,212,0.12)]"
          : "border-ace-border bg-ace-panel hover:border-zinc-600"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${s.label}`}>
          {capability.category}
        </span>
        <span className="text-xs text-ace-mint">${capability.price_usdc.toFixed(4)} USDC</span>
      </div>
      <h3 className="mb-2 text-sm font-medium leading-snug text-zinc-100">{capability.objective}</h3>
      <div
        className="mb-2 h-1.5 overflow-hidden rounded bg-black/50"
        role="progressbar"
        aria-valuenow={reliability}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reliability ${reliability}%`}
      >
        <div
          className={`h-full bg-gradient-to-r ${s.bar}`}
          style={{ width: `${Math.min(reliability, 100)}%` }}
        />
      </div>
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
