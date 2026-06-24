"use client";

import CapabilityRegistry from "@/components/CapabilityRegistry";
import IncidentSandbox from "@/components/IncidentSandbox";
import LedgerPanel from "@/components/LedgerPanel";
import MetricsPanel from "@/components/MetricsPanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-ace-bg p-4 lg:p-6">
      <header className="mb-6 flex items-center justify-between border-b border-ace-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ACE</h1>
          <p className="text-sm text-ace-muted">Agent Capability Exchange — SRE Fault Control Center</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-ace-mint animate-pulse" />
          <span className="text-xs text-ace-muted">DEMO MODE</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-3">
          <CapabilityRegistry />
        </section>
        <section className="lg:col-span-6">
          <IncidentSandbox />
        </section>
        <section className="flex flex-col gap-4 lg:col-span-3">
          <MetricsPanel />
          <LedgerPanel />
        </section>
      </div>
    </main>
  );
}
