"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAceStore } from "@/store/useAceStore";
import { getCapability } from "@/lib/api";
import type { Capability } from "@/lib/types";

/**
 * Resolved-Incidents history view — the audit tail of agent purchases.
 * Driven by real /ledger data; each settlement expands to the capability's
 * decision tree. Mobile-first (single column, large tap targets).
 */
export default function HistoryPage() {
  const ledger = useAceStore((s) => s.ledger);
  const savings = useAceStore((s) => s.savings);
  const fetchAll = useAceStore((s) => s.fetchAll);
  const loading = useAceStore((s) => s.loading.ledger);

  const [openId, setOpenId] = useState<number | null>(null);
  const [caps, setCaps] = useState<Record<string, Capability>>({});

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggle = async (id: number, capId: string) => {
    setOpenId((cur) => (cur === id ? null : id));
    if (!caps[capId]) {
      try {
        const c = await getCapability(capId);
        setCaps((m) => ({ ...m, [capId]: c }));
      } catch {
        /* capability detail unavailable — leave tree collapsed */
      }
    }
  };

  const rows = [...ledger].sort((a, b) => b.id - a.id);

  return (
    <main className="min-h-screen bg-ace-bg p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between border-b border-ace-border pb-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Resolved Incidents
            </h1>
            <p className="text-xs text-ace-muted">
              Audit trail of capability purchases the agent has settled
            </p>
          </div>
          <Link
            href="/"
            className="rounded border border-ace-border bg-ace-panel px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
          >
            ‹ Sandbox
          </Link>
        </header>

        {/* Savings summary */}
        <section className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded border border-ace-border bg-ace-border">
          <div className="bg-ace-panel p-3">
            <div className="text-[9px] uppercase tracking-wide text-ace-muted">saved</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-ace-mint tabular-nums">
              {savings ? savings.total_saved_usdc.toFixed(4) : "—"}
              <span className="ml-1 text-[10px] font-normal text-ace-muted">USDC</span>
            </div>
          </div>
          <div className="bg-ace-panel p-3">
            <div className="text-[9px] uppercase tracking-wide text-ace-muted">spent</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
              {savings ? savings.total_spent_usdc.toFixed(4) : "—"}
              <span className="ml-1 text-[10px] font-normal text-ace-muted">USDC</span>
            </div>
          </div>
          <div className="bg-ace-panel p-3">
            <div className="text-[9px] uppercase tracking-wide text-ace-muted">settlements</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
              {savings ? savings.settlements : "—"}
            </div>
          </div>
        </section>

        {loading && rows.length === 0 ? (
          <p className="py-12 text-center text-xs text-ace-muted">Loading ledger…</p>
        ) : rows.length === 0 ? (
          <div className="rounded border border-dashed border-ace-border p-12 text-center">
            <p className="text-xs text-ace-muted">No settlements yet.</p>
            <p className="mt-1 text-[11px] text-zinc-600">
              Trigger an incident in the sandbox to record a purchase.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((e) => {
              const cap = caps[e.capability_id];
              const open = openId === e.id;
              return (
                <li
                  key={e.id}
                  className="overflow-hidden rounded border border-ace-border bg-ace-panel"
                >
                  <button
                    onClick={() => toggle(e.id, e.capability_id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-black/30"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-ace-mint"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-xs text-zinc-100">
                        {e.capability_id}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-zinc-500">
                        {e.settled_at
                          ? new Date(e.settled_at).toLocaleString()
                          : e.created_at
                            ? new Date(e.created_at).toLocaleString()
                            : "—"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-semibold text-ace-mint tabular-nums">
                        −{e.amount_usdc.toFixed(4)}
                      </div>
                      <div className="text-[9px] uppercase tracking-wide text-ace-mint">
                        {e.status}
                      </div>
                    </div>
                    <span className={`shrink-0 text-zinc-500 transition ${open ? "rotate-90" : ""}`} aria-hidden="true">
                      ›
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-ace-border bg-black/30 p-3">
                      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500">
                        <span>
                          tx{" "}
                          <span className="font-mono text-zinc-300">
                            {e.tx_hash ? `${e.tx_hash.slice(0, 10)}…` : "—"}
                          </span>
                        </span>
                        <span>
                          seller{" "}
                          <span className="font-mono text-zinc-300">
                            {e.seller ? `${e.seller.slice(0, 8)}…` : "—"}
                          </span>
                        </span>
                      </div>

                      {cap ? (
                        <div>
                          <div className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-ace-muted">
                            Decision tree · {cap.decision_points?.length ?? 0} points
                          </div>
                          <ol className="space-y-2">
                            {cap.decision_points?.map((dp, i) => (
                              <li key={i} className="grid grid-cols-[auto_1fr] gap-x-2">
                                <span className="font-mono text-[10px] text-zinc-600">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <div className="font-mono text-[11px] text-ace-cyan">
                                    {dp.condition}
                                  </div>
                                  <div className="text-[11px] text-zinc-200">→ {dp.action}</div>
                                  {dp.failsafe && (
                                    <div className="text-[10px] text-amber-300">
                                      failsafe · {dp.failsafe}
                                    </div>
                                  )}
                                  {dp.security_policy && (
                                    <div className="text-[10px] text-ace-rose">
                                      policy · {dp.security_policy}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-600">Loading capability…</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
