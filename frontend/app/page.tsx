"use client";

import { useEffect } from "react";

import CapabilityRegistry from "@/components/CapabilityRegistry";
import IncidentSandbox from "@/components/IncidentSandbox";
import LedgerPanel from "@/components/LedgerPanel";
import MetricsPanel from "@/components/MetricsPanel";
import { useAceStore } from "@/store/useAceStore";

export default function Home() {
  const { fetchAll, resetAll, trace } = useAceStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <main className="min-h-screen bg-ace-bg p-2 sm:p-4 lg:p-6">
      <header className="mb-4 flex items-center justify-between border-b border-ace-border pb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">ACE</h1>
          <p className="text-xs text-ace-muted sm:text-sm">
            Agent Capability Exchange — SRE Fault Control Center
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset button — only visible when there's trace history */}
          {trace.length > 0 && (
            <button
              onClick={resetAll}
              aria-label="Reset sandbox and clear trace"
              className="rounded border border-ace-border bg-ace-panel px-2 py-1 text-[10px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              Reset
            </button>
          )}
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-ace-mint" aria-hidden="true" />
          <span className="text-[10px] text-ace-muted sm:text-xs">DEMO MODE</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:h-[calc(100vh-141px)] lg:min-h-[560px] lg:grid-cols-12 lg:items-stretch">
        <section className="flex min-h-0 min-w-0 lg:col-span-3">
          <CapabilityRegistry />
        </section>
        <section className="flex min-h-0 min-w-0 lg:col-span-6">
          <IncidentSandbox />
        </section>
        <section className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-3">
          <MetricsPanel />
          <LedgerPanel />
        </section>
      </div>
    </main>
  );
}
