"use client";

interface Props {
  /** Estimated cost of solving via trial-and-error, e.g. "$0.2500". */
  directCost: string;
  /** Purchased capability pack price, e.g. "$0.0020". */
  packPrice: string;
  /** Savings percentage, e.g. "92%". */
  savingsPct: string;
  /** Whether the run has fully resolved (fills the progress bar). */
  resolved: boolean;
}

/**
 * The decisive ROI visual — direct trial-and-error cost vs verified pack
 * price vs cost saved. Promoted from a cramped 3-column tile to a
 * full-width hero so the economic payoff is the thing the eye lands on.
 */
export default function RoiHero({ directCost, packPrice, savingsPct, resolved }: Props) {
  return (
    <section
      aria-label="ROI decision"
      className="mb-3 rounded border border-emerald-300/30 bg-gradient-to-r from-emerald-400/10 via-emerald-400/[0.03] to-transparent p-3"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ace-mint">
        ROI gate · purchase justified
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wide text-zinc-500">
            direct trial-and-error
          </span>
          <span className="text-lg font-semibold tracking-tight text-ace-rose line-through decoration-1">
            {directCost}
          </span>
        </div>
        <span className="text-zinc-600">vs</span>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wide text-zinc-500">
            verified capability
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">{packPrice}</span>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-wide text-zinc-500">cost saved</span>
          <span className="text-2xl font-semibold tracking-tight text-ace-mint">{savingsPct}</span>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded bg-ace-bg">
        <div
          className={`h-full bg-gradient-to-r from-amber-300 to-ace-mint transition-all duration-700 ${resolved ? "w-full" : "w-[92%]"}`}
          role="progressbar"
          aria-label="Cost savings progress"
        />
      </div>
    </section>
  );
}
