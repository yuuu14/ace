"use client";

import type { Capability } from "@/lib/types";

interface Props {
  capability: Capability;
}

export default function CodeInspector({ capability }: Props) {
  const yaml = `capability:
  id: "${capability.id}"
  version: "${capability.version}"
  objective: "${capability.objective}"
  category: "${capability.category}"
  price_usdc: ${capability.price_usdc}

trigger_signatures:${capability.trigger_signatures
    .map(
      (t) =>
        `\n  - ${
          t.error_code
            ? `error_code: "${t.error_code}"`
            : `terminal_log_pattern: "${t.terminal_log_pattern}"`
        }`,
    )
    .join("")}

decision_points:${capability.decision_points
    .map(
      (d) =>
        `\n  - condition: "${d.condition}"
    action: "${d.action}"${d.failsafe ? `\n    failsafe: "${d.failsafe}"` : ""}${
          d.security_policy ? `\n    security_policy: "${d.security_policy}"` : ""
        }`,
    )
    .join("")}

attestation:
  auditor_address: "${capability.attestation?.auditor_address ?? ""}"
  timestamp: ${capability.attestation?.timestamp ?? 0}
  signature: "${capability.attestation?.signature ?? ""}"
`;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-ace-border bg-black/50">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-ace-border px-3 py-2">
        <span className="shrink-0 text-xs font-semibold text-ace-muted">Code Inspector</span>
        <span className="min-w-0 truncate text-[10px] text-ace-cyan">{capability.id}</span>
      </div>
      <pre
        className="max-h-60 max-w-full overflow-auto p-3 text-[11px] leading-relaxed text-zinc-300"
        role="region"
        aria-label="Capability YAML definition"
      >
        <code>{yaml}</code>
      </pre>
    </div>
  );
}
