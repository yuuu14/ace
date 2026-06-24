"use client";

import { useAceStore } from "@/store/useAceStore";

export default function LedgerPanel() {
  const { ledger, loading, error } = useAceStore();

  return (
    <div className="glass flex min-h-0 flex-1 flex-col rounded-xl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ace-muted">
        Nanopayment Ledger
      </h2>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {/* Loading */}
        {loading.ledger && ledger.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8" role="status" aria-label="Loading ledger">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-ace-cyan border-t-transparent" aria-hidden="true" />
            <span className="text-xs text-ace-muted">Loading…</span>
          </div>
        )}

        {/* Error */}
        {error.ledger && (
          <div className="rounded border border-rose-400/30 bg-rose-500/10 p-3 text-center text-xs text-ace-rose" role="alert">
            {error.ledger}
          </div>
        )}

        {/* Empty */}
        {!loading.ledger && !error.ledger && ledger.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-ace-muted" role="status">
            No nanopayment transactions yet.
          </div>
        )}

        {/* Entries */}
        {ledger.map((entry) => (
          <div
            key={entry.id}
            className="rounded border border-ace-border bg-ace-panel/50 p-2 text-[10px]"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-ace-cyan">{entry.capability_id}</span>
              <span className="text-ace-mint">+${entry.amount_usdc.toFixed(4)}</span>
            </div>
            <div className="truncate text-zinc-500">Tx: {entry.tx_hash ?? "pending"}</div>
            <div className="mt-1 text-zinc-500">
              {entry.buyer} → {entry.seller}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
