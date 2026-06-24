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

trigger_signatures:
${capability.trigger_signatures
  .map((t) => `  - ${t.error_code ? `error_code: "${t.error_code}"` : `terminal_log_pattern: "${t.terminal_log_pattern}"`}`)
  .join("\n")}

decision_points:
${capability.decision_points
  .map(
    (d) => `  - condition: "${d.condition}"
    action: "${d.action}"${d.failsafe ? `\n    failsafe: "${d.failsafe}"` : ""}${
      d.security_policy ? `\n    security_policy: "${d.security_policy}"` : ""
    }`,
  )
  .join("\n")}

attestation:
  auditor_address: "${capability.attestation?.auditor_address ?? ""}"
  timestamp: ${capability.attestation?.timestamp ?? 0}
  signature: "${capability.attestation?.signature ?? ""}"
`;

  return (
    <div className="mt-4 rounded-lg border border-ace-border bg-black/50">
      <div className="flex items-center justify-between border-b border-ace-border px-3 py-2">
        <span className="text-xs font-semibold text-ace-muted">Code Inspector</span>
        <span className="text-[10px] text-ace-cyan">{capability.id}</span>
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-[11px] leading-relaxed text-zinc-300">
        <code>{yaml}</code>
      </pre>
    </div>
  );
}
