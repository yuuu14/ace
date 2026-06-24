"use client";

import { useAceStore } from "@/store/useAceStore";

export default function MetricsPanel() {
  const { savings, loading, error } = useAceStore();

  return (
    <div className="glass flex min-h-[188px] shrink-0 flex-col justify-between rounded-xl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ace-muted">
        Cumulative Savings
      </h2>

      {loading.savings && !savings && (
        <div className="flex items-center justify-center gap-2 py-4" role="status" aria-label="Loading savings">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-ace-cyan border-t-transparent" aria-hidden="true" />
          <span className="text-xs text-ace-muted">Loading…</span>
        </div>
      )}

      {error.savings && (
        <div className="rounded border border-rose-400/30 bg-rose-500/10 p-2 text-center text-xs text-ace-rose" role="alert">
          {error.savings}
        </div>
      )}

      {!loading.savings && !error.savings && (
        <>
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
        </>
      )}
    </div>
  );
}
