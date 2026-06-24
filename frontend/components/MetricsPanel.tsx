"use client";

import { useEffect } from "react";

import { useAceStore } from "@/store/useAceStore";
import { getSavings } from "@/lib/api";

export default function MetricsPanel() {
  const { savings, setSavings } = useAceStore();

  useEffect(() => {
    getSavings().then(setSavings).catch(console.error);
  }, [setSavings]);

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ace-muted">
        Cumulative Savings
      </h2>
      <div className="mb-4">
        <div className="text-3xl font-bold text-ace-mint">
          ${savings ? savings.total_saved_usdc.toFixed(2) : "0.00"} USDC
        </div>
        <div className="text-xs text-ace-muted">Saved vs direct LLM trial-and-error</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-ace-border bg-ace-panel/50 p-2">
          <div className="text-lg font-semibold text-white">{savings?.settlements ?? 0}</div>
          <div className="text-[10px] text-ace-muted">Settlements</div>
        </div>
        <div className="rounded border border-ace-border bg-ace-panel/50 p-2">
          <div className="text-lg font-semibold text-white">
            ${savings ? savings.total_spent_usdc.toFixed(4) : "0.0000"}
          </div>
          <div className="text-[10px] text-ace-muted">Total Spent</div>
        </div>
      </div>
    </div>
  );
}
