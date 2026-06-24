"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TraceLine } from "@/lib/types";
import {
  phaseConfig,
  sourceLabels,
  buildPhaseGroups,
  computePhaseStates,
  classifyState,
  extractMoney,
  extractPercent,
  dotBgClass,
  borderBgClass,
  evidenceBorderClass,
} from "@/lib/traceEngine";

interface Props {
  lines: TraceLine[];
}

export default function TraceConsole({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [stateCursor, setStateCursor] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const groups = useMemo(() => buildPhaseGroups(lines), [lines]);
  const safeGroupIndex = Math.min(stateCursor, Math.max(groups.length - 1, 0));
  const activeGroup = groups[safeGroupIndex] ?? groups.at(-1);

  // Build phase summaries from visible (all) lines
  const phaseStates = useMemo(() => computePhaseStates(lines), [lines]);
  const activePhases = phaseStates.filter((p) => p.active);

  // Classify states from groups
  const stateEvents = useMemo(
    () =>
      groups.map((g) => {
        const last = g.lines.at(-1) as TraceLine;
        return classifyState(last, g.end, lines);
      }),
    [groups, lines],
  );
  const curState = stateEvents[safeGroupIndex] ?? stateEvents.at(-1);

  // Sync cursor to latest group
  useEffect(() => {
    setStateCursor(Math.max(groups.length - 1, 0));
  }, [groups.length]);

  // Summary stats
  const { directCost, packPrice, savingsPct } = useMemo(() => {
    const all = lines.map((l) => l.text).join(" ");
    const m = extractMoney(all);
    const p = extractPercent(all);
    return {
      directCost: m[0] ?? "$0.0252",
      packPrice: m[1] ?? "$0.0020",
      savingsPct: p.at(-1) ?? "92.06%",
    };
  }, [lines]);

  const matchSeen = lines.some((l) => l.source === "Match");
  const costSeen = lines.some((l) => l.source === "Calculus" && l.text.includes("Estimated Direct Cost"));
  const paymentSeen = lines.some((l) => l.source === "Payment");
  const paymentSettled = lines.some((l) => l.text.includes("Authorization accepted"));
  const resolved = lines.some((l) => l.source === "Complete");
  const hasDetail = costSeen || matchSeen || paymentSeen || resolved;

  /* ---- Empty state ---- */
  if (lines.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col overflow-hidden rounded-lg border border-ace-border bg-black/70"
        role="region"
        aria-label="Agent observability trace console"
      >
        <div className="border-b border-ace-border bg-ace-panel/50 px-3 py-2">
          <span className="text-xs font-semibold text-ace-muted">Agent Observability</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="inline-flex h-8 w-8 rounded-full border-2 border-ace-muted/40" aria-hidden="true" />
          <p className="text-xs text-ace-muted">
            Press <kbd className="rounded border border-ace-border bg-ace-panel px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">Trigger</kbd> to start an incident simulation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-ace-border bg-[#08090f]/90"
      role="region"
      aria-label="Agent observability trace console"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ace-border bg-ace-panel/50 px-3 py-2 max-sm:flex-col max-sm:items-start max-sm:gap-1">
        <span className="text-xs font-semibold text-ace-muted">Agent Observability</span>
        <span
          className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${borderBgClass(curState?.color ?? "cyan", true)}`}
          aria-live="polite"
        >
          {curState?.label ?? resolved ? "Execution" : "Running"}
        </span>
      </div>

      {/* State + evidents */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        {/* Live Agent State card */}
        <div
          className="mb-3 rounded border border-ace-border bg-gradient-to-r from-[#14101d] via-[#0c1220] to-[#091713] p-3"
          role="status"
          aria-live="polite"
        >
          {/* Title + nav */}
          <div className="mb-3 flex items-start justify-between gap-3 max-sm:flex-col">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ace-muted">
                Live Agent State
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {curState?.title ?? "Incident signal acquired"}
              </div>
              <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-zinc-300">
                {curState?.summary ?? "Waiting for the agent to classify the incident."}
              </p>
            </div>
            <nav className="flex shrink-0 items-center gap-2" aria-label="State navigation">
              <button
                aria-label="Previous agent state"
                onClick={() => setStateCursor((v) => Math.max(v - 1, 0))}
                disabled={stateCursor <= 0}
                className="flex h-7 w-7 items-center justify-center rounded border border-ace-border bg-black/30 text-sm text-zinc-300 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-35"
              >
                ‹
              </button>
              <span className="min-w-12 text-center text-[10px] text-zinc-500">
                {stateEvents.length ? safeGroupIndex + 1 : 0}/{stateEvents.length}
              </span>
              <button
                aria-label="Next agent state"
                onClick={() =>
                  setStateCursor((v) => Math.min(v + 1, stateEvents.length - 1))
                }
                disabled={stateCursor >= stateEvents.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-ace-border bg-black/30 text-sm text-zinc-300 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-35"
              >
                ›
              </button>
            </nav>
          </div>

          {/* Metric + phase chips */}
          <div className="flex flex-wrap gap-2">
            {curState && (
              <div
                className={`rounded border px-2 py-1.5 ${borderBgClass(curState.color, true)}`}
                aria-label={`Current metric: ${curState.metric}`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide">Metric</div>
                <div className="mt-0.5 text-[10px] opacity-80">{curState.metric}</div>
              </div>
            )}
            {activePhases.map((phase) => (
              <div
                key={phase.key}
                className={`flex max-w-52 items-center gap-2 rounded border px-2 py-1.5 ${borderBgClass(phase.color, true)}`}
                aria-label={`Phase: ${phase.label}, ${phase.count} events`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${dotBgClass(phase.color)}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide">
                    {phase.label}
                  </div>
                  <div className="truncate text-[10px] opacity-75">{phase.count} events</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail cards */}
        {hasDetail && (
          <div className="mb-4 grid grid-cols-1 content-start gap-3 lg:grid-cols-2">
            {costSeen && (
              <section
                className="rounded border border-amber-300/30 bg-amber-400/10 p-3"
                aria-label="Economic decision"
              >
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-ace-muted">
                  Economic Decision
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Direct", value: directCost, color: "text-ace-rose" },
                    { label: "Pack", value: packPrice, color: "text-ace-cyan" },
                    { label: "Saved", value: savingsPct, color: "text-ace-mint" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded bg-black/40 p-2">
                      <div className="text-[10px] text-zinc-500">{label}</div>
                      <div className={`text-sm font-semibold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded bg-ace-bg">
                  <div
                    className="h-full w-[92%] bg-gradient-to-r from-amber-300 to-emerald-300"
                    role="progressbar"
                    aria-valuenow={92}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Cost savings progress"
                  />
                </div>
              </section>
            )}

            {matchSeen && (
              <section
                className="rounded border border-violet-300/30 bg-violet-400/10 p-3"
                aria-label="Capability match result"
              >
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-ace-muted">
                  Capability Route
                </div>
                <div className="space-y-2 text-[11px]">
                  {[
                    { label: "Match", value: lines.find((l) => l.source === "Match")?.text.match(/'([^']+)'/)?.[1] ?? "N/A", color: "text-ace-cyan" },
                    { label: "Attestation", value: "verified", color: "text-ace-mint" },
                    { label: "Execution Plan", value: "4 decision points", color: "text-zinc-200" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500">{label}</span>
                      <span className={`truncate text-right ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {paymentSeen && (
              <section
                className="rounded border border-cyan-300/30 bg-cyan-400/10 p-3"
                aria-label="x402 payment settlement"
              >
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-ace-muted">
                  x402 Settlement
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  {["402", "EIP-712", "USDC"].map((label, idx) => {
                    const done =
                      paymentSettled || (paymentSeen && idx < 2);
                    return (
                      <div
                        key={label}
                        className={`rounded border px-2 py-3 ${
                          done
                            ? "border-ace-mint/50 bg-ace-mint/10 text-ace-mint"
                            : "border-ace-border bg-black/40 text-zinc-500"
                        }`}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[11px] text-zinc-400">
                  {paymentSettled
                    ? "Authorization accepted and ledger updated."
                    : "Authorization in progress."}
                </div>
              </section>
            )}

            {resolved && (
              <section
                className="rounded border border-emerald-300/30 bg-emerald-400/10 p-3"
                aria-label="Recovery resolution"
              >
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-ace-muted">
                  Resolution
                </div>
                <div className="text-sm font-semibold text-emerald-100">
                  Wallet recovery path completed
                </div>
                <div className="mt-2 text-[11px] leading-relaxed text-zinc-300">
                  The agent executed the purchased decision tree and wrote settlement evidence
                  to the ledger.
                </div>
              </section>
            )}
          </div>
        )}

        {/* Evidence stream */}
        <div className="flex min-h-0 flex-1 flex-col rounded border border-ace-border bg-black/50">
          <div className="border-b border-ace-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-ace-muted">
            Evidence Stream
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className={`terminal-line mb-1 rounded border px-2 py-1 ${evidenceBorderClass(line.source)} ${
                  line.highlight === "rose"
                    ? "text-ace-rose"
                    : line.highlight === "mint"
                      ? "text-ace-mint"
                      : line.highlight === "cyan"
                        ? "text-ace-cyan"
                        : "text-zinc-300"
                }`}
                role="log"
                aria-label={`${sourceLabels[line.source]}: ${line.text}`}
              >
                <span className="mr-2 inline-block w-12 shrink-0 text-ace-cyan">
                  [{sourceLabels[line.source]}]
                </span>
                <span className="text-zinc-200">{line.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
