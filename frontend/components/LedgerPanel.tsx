"use client";

import { useEffect } from "react";

import { useAceStore } from "@/store/useAceStore";
import { listLedger } from "@/lib/api";

export default function LedgerPanel() {
  const { ledger, setLedger } = useAceStore();

  useEffect(() => {
    listLedger().then(setLedger).catch(console.error);
  }, [setLedger]);

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ace-muted">
        Nanopayment Ledger
      </h2>
      <div className="max-h-64 overflow-y-auto space-y-2">
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
        {ledger.length === 0 && (
          <div className="text-xs text-ace-muted">No nanopayment transactions yet.</div>
        )}
      </div>
    </div>
  );
}
