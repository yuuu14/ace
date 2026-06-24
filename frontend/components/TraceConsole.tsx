"use client";

import { useEffect, useRef } from "react";

import type { TraceLine } from "@/lib/types";

interface Props {
  lines: TraceLine[];
}

const sourceColors: Record<TraceLine["source"], string> = {
  "ACE Console": "text-ace-cyan",
  Calculus: "text-ace-muted",
  Lookup: "text-zinc-400",
  Match: "text-ace-cyan",
  Payment: "text-ace-rose",
  Complete: "text-ace-mint",
  Error: "text-ace-rose",
};

export default function TraceConsole({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-ace-border bg-black/70">
      <div className="border-b border-ace-border bg-ace-panel/50 px-3 py-2">
        <span className="text-xs font-semibold text-ace-muted">Agent Trace Console</span>
      </div>
      <div className="h-[500px] overflow-y-auto p-3 font-mono text-xs">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`terminal-line mb-1 ${line.highlight === "rose" ? "text-ace-rose" : line.highlight === "mint" ? "text-ace-mint" : line.highlight === "cyan" ? "text-ace-cyan" : "text-zinc-300"}`}
          >
            <span className={`mr-2 inline-block w-20 shrink-0 ${sourceColors[line.source]}`}>[{line.source}]</span>
            <span className="text-zinc-300">{line.text}</span>
          </div>
        ))}
        {lines.length === 0 && (
          <div className="text-ace-muted">Waiting for incident injection...</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
