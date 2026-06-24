"use client";

import type { TraceLine } from "@/lib/types";
import { computePhaseStates } from "@/lib/traceEngine";

/**
 * Canonical agent-trace primitive: a horizontal 5-phase rail (done /
 * active / pending) derived from the visible trace lines. This is the
 * one-glance "where is the agent" surface the old console lacked.
 */
const COLOR: Record<string, { node: string; fill: string; text: string }> = {
  rose: { node: "border-ace-rose", fill: "bg-ace-rose", text: "text-ace-rose" },
  amber: { node: "border-amber-300", fill: "bg-amber-300", text: "text-amber-300" },
  violet: { node: "border-violet-300", fill: "bg-violet-300", text: "text-violet-300" },
  cyan: { node: "border-cyan-300", fill: "bg-cyan-300", text: "text-cyan-300" },
  mint: { node: "border-ace-mint", fill: "bg-ace-mint", text: "text-ace-mint" },
};

export default function TraceTimeline({ lines }: { lines: TraceLine[] }) {
  const phases = computePhaseStates(lines);

  return (
    <nav
      aria-label="Agent phase timeline"
      className="flex items-stretch overflow-hidden rounded border border-ace-border bg-ace-panel/40"
    >
      {phases.map((p, i) => {
        const c = COLOR[p.color] ?? COLOR.cyan;
        const status: "done" | "active" | "pending" = p.complete
          ? "done"
          : p.active
            ? "active"
            : "pending";
        const filled = status === "done" || status === "active";
        return (
          <div
            key={p.key}
            className={`flex flex-1 items-center gap-2 px-2.5 py-2 ${i < phases.length - 1 ? "border-r border-ace-border" : ""} ${status === "active" ? "bg-black/30" : ""}`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${c.node} ${filled ? c.fill : "bg-transparent"} ${status === "active" ? "animate-pulse" : ""}`}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div
                className={`truncate text-[9px] font-semibold uppercase tracking-wide ${status === "pending" ? "text-zinc-600" : c.text}`}
              >
                {p.label}
              </div>
              <div className="truncate text-[9px] text-zinc-500">
                {p.count} event{p.count === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
