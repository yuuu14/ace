"use client";

interface Props {
  /** LLM summary of the incident triage (from ResolveResponse.live_analysis). */
  summary?: string | null;
  /** Why the model recommended the chosen route. */
  rationale?: string | null;
  /** Model self-reported confidence, 0–1. */
  confidence?: number | null;
  /** Optional provider/model label, e.g. "deepseek-v4-flash". */
  provider?: string | null;
}

/**
 * First-class "agent reasoning" surface. Shows what the model is thinking
 * (summary + rationale + confidence) instead of burying it in a trace log
 * line. Renders only when there is real live-analysis to show.
 */
export default function AgentThinkingPanel({ summary, rationale, confidence, provider }: Props) {
  if (!summary && !rationale) return null;

  const conf =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? Math.round(Math.max(0, Math.min(1, confidence)) * 100)
      : null;

  return (
    <section
      aria-label="Agent reasoning"
      className="mb-3 rounded border border-amber-300/30 bg-amber-400/[0.07] p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-200">
          Agent reasoning
        </span>
        {provider && <span className="ml-auto text-[9px] text-zinc-500">{provider}</span>}
      </div>

      {summary && (
        <p className="text-[11px] leading-relaxed text-zinc-100">{summary}</p>
      )}
      {rationale && (
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{rationale}</p>
      )}

      {conf !== null && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wide text-zinc-500">confidence</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-ace-bg">
            <div
              className="h-full bg-amber-300 transition-all duration-700"
              style={{ width: `${conf}%` }}
              role="progressbar"
              aria-valuenow={conf}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Model confidence"
            />
          </div>
          <span className="text-[11px] font-semibold text-amber-300">{conf}%</span>
        </div>
      )}
    </section>
  );
}
