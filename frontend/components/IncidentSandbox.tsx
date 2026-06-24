"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

import TraceConsole from "@/components/TraceConsole";
import PaymentOverlay from "@/components/PaymentOverlay";
import { useAceStore } from "@/store/useAceStore";
import { resolveIncident, paywallDownload, listLedger, getSavings } from "@/lib/api";
import { buildResolveTrace, buildExecutionTrace } from "@/lib/mockTrace";
import type { TraceLine } from "@/lib/types";

export default function IncidentSandbox() {
  const {
    trace,
    loading,
    alert,
    showPaymentOverlay,
    capabilities,
    appendTrace,
    clearTrace,
    setLoading,
    setAlert,
    setShowPaymentOverlay,
    setLedger,
    setSavings,
    setLiveAnalysis,
    setError,
    error,
  } = useAceStore();

  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const autoRun = useRef<boolean>(false);

  // Mount: refresh ledger + savings
  useEffect(() => {
    listLedger().then(setLedger).catch(console.error);
    getSavings().then(setSavings).catch(console.error);
  }, [setLedger, setSavings]);

  // Auto-proceed: ROI → payment → execution (always auto on first trigger)
  useEffect(() => {
    if (resolvedId && autoRun.current) {
      autoRun.current = false;
      const timer = setTimeout(() => {
        unlockAndExecute();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [resolvedId]);

  const injectOutage = useCallback(async () => {
    // If there's already a trace, reset before running again
    if (trace.length > 0) {
      clearTrace();
      setResolvedId(null);
      setError("sandbox", null);
    }

    setAlert(true);
    setLoading("sandbox", true);
    autoRun.current = true;

    appendTrace([
      {
        source: "ACE Console",
        text: "CRITICAL: Spender wallet hit spend limit threshold. API transaction aborted.",
        highlight: "rose",
      },
    ]);

    await new Promise((r) => setTimeout(r, 600));
    appendTrace([{ source: "Calculus", text: "Projecting direct trial-and-error recovery cost..." }]);
    await new Promise((r) => setTimeout(r, 500));

    try {
      const response = await resolveIncident(
        "402_LIMIT_EXCEEDED",
        "Error: CLI execution limit exceeded on stablecoin transfer",
      );
      const cap = capabilities.find((c) => c.id === response.capability_id);
      if (response.live_analysis) {
        setLiveAnalysis({
          summary: response.live_analysis.summary,
          rationale: response.live_analysis.rationale,
          confidence: response.live_analysis.confidence,
        });
      }
      appendTrace(buildResolveTrace(response, cap?.objective));

      if (response.accepted && response.capability_id) {
        setResolvedId(response.capability_id);
      } else {
        setLoading("sandbox", false);
        setAlert(false);
        autoRun.current = false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appendTrace([{ source: "Error", text: msg, highlight: "rose" }]);
      setError("sandbox", msg);
      setLoading("sandbox", false);
      setAlert(false);
      autoRun.current = false;
    }
  }, [trace.length]);

  const unlockAndExecute = useCallback(async () => {
    const id = resolvedId;
    if (!id) return;

    setLoading("sandbox", true);
    setShowPaymentOverlay(true);

    const paymentTrace: TraceLine[] = [
      { source: "Payment", text: "Server returned HTTP 402 (Payment Required).", highlight: "rose" },
      {
        source: "Payment",
        text: "Decoding x402 PAYMENT-REQUIRED challenge for TransferWithAuthorization...",
        highlight: "cyan",
      },
      {
        source: "Payment",
        text: "Signing EIP-712 typed data with Consumer Agent key (off-chain, gas-free)...",
        highlight: "cyan",
      },
      {
        source: "Payment",
        text: "Submitting signed authorization to Circle Gateway facilitator...",
        highlight: "cyan",
      },
    ];
    appendTrace(paymentTrace);

    try {
      const { capability, payload } = await paywallDownload(id);
      appendTrace([
        {
          source: "Payment",
          text: `Authorization accepted. Signature: ${payload.signature.slice(0, 18)}...`,
          highlight: "mint",
        },
        { source: "Payment", text: `Downloading capability ${capability.id}...` },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appendTrace([{ source: "Error", text: msg, highlight: "rose" }]);
      setShowPaymentOverlay(false);
      setAlert(false);
      setLoading("sandbox", false);
      setError("sandbox", msg);
      return;
    }

    setShowPaymentOverlay(false);
    appendTrace(buildExecutionTrace());

    try {
      const [ledger, sv] = await Promise.all([listLedger(), getSavings()]);
      setLedger(ledger);
      setSavings(sv);
    } catch (err) {
      console.error("Failed to refresh ledger/savings:", err);
    }

    setLoading("sandbox", false);
    setAlert(false);
    setResolvedId(null);
  }, [resolvedId]);

  const busy = loading.sandbox;
  const sandboxError = error.sandbox;

  return (
    <motion.div
      animate={alert ? { boxShadow: "0 0 30px rgba(244,63,94,0.25)" } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      className="glass relative flex min-h-0 flex-1 flex-col rounded-xl p-4"
    >
      <div className="mb-4 flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ace-muted">
          Live Sandbox &amp; Traces
        </h2>
        <div className="flex flex-wrap gap-2">
          {sandboxError && (
            <span
              className="rounded border border-rose-400/40 bg-rose-500/10 px-2 py-1.5 text-[10px] text-ace-rose"
              role="alert"
            >
              {sandboxError}
            </span>
          )}
          <button
            onClick={injectOutage}
            disabled={busy}
            aria-label="Trigger a Circle spend-limit error incident"
            className="rounded bg-ace-rose px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {busy ? "Running..." : "Trigger Circle spend-limit error"}
          </button>
        </div>
      </div>

      <TraceConsole lines={trace} />
      {showPaymentOverlay && <PaymentOverlay />}
    </motion.div>
  );
}
