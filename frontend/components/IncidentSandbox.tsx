"use client";

import { useEffect, useRef, useState } from "react";
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
  } = useAceStore();
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const autoRun = useRef<boolean>(false);

  useEffect(() => {
    listLedger().then(setLedger).catch(console.error);
    getSavings().then(setSavings).catch(console.error);
  }, [setLedger, setSavings]);

  // Auto-proceed from ROI decision to payment + execution
  useEffect(() => {
    if (resolvedId && autoRun.current) {
      autoRun.current = false;
      const timer = setTimeout(() => {
        unlockAndExecute();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [resolvedId]);

  const injectOutage = async () => {
    clearTrace();
    setAlert(true);
    setLoading(true);
    setResolvedId(null);
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
      appendTrace(buildResolveTrace(response, cap?.objective));

      if (response.accepted && response.capability_id) {
        setResolvedId(response.capability_id);
      } else {
        setLoading(false);
        setAlert(false);
        autoRun.current = false;
      }
    } catch (err) {
      appendTrace([{ source: "Error", text: String(err), highlight: "rose" }]);
      setLoading(false);
      setAlert(false);
      autoRun.current = false;
    }
  };

  const unlockAndExecute = async () => {
    if (!resolvedId) return;
    setLoading(true);
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
      const { capability, payload } = await paywallDownload(resolvedId);
      appendTrace([
        {
          source: "Payment",
          text: `Authorization accepted. Signature: ${payload.signature.slice(0, 18)}...`,
          highlight: "mint",
        },
        { source: "Payment", text: `Downloading capability ${capability.id}...` },
      ]);
    } catch (err) {
      console.error("paywallDownload failed:", err);
      appendTrace([{ source: "Error", text: String(err), highlight: "rose" }]);
      setShowPaymentOverlay(false);
      setAlert(false);
      setLoading(false);
      return;
    }

    setShowPaymentOverlay(false);
    appendTrace(buildExecutionTrace());

    try {
      const [ledger, savings] = await Promise.all([listLedger(), getSavings()]);
      setLedger(ledger);
      setSavings(savings);
    } catch (err) {
      console.error("Failed to refresh ledger/savings:", err);
    }

    setLoading(false);
    setAlert(false);
  };

  return (
    <motion.div
      animate={alert ? { boxShadow: "0 0 30px rgba(244,63,94,0.25)" } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      className="glass relative flex h-full min-h-[600px] flex-col rounded-xl p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ace-muted">Live Sandbox &amp; Traces</h2>
        <div className="flex gap-2">
          {resolvedId && (
            <button
              onClick={unlockAndExecute}
              disabled={loading}
              className="rounded bg-ace-cyan px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
            >
              Re-run Unlock &amp; Execute
            </button>
          )}
          <button
            onClick={injectOutage}
            disabled={loading}
            className="rounded bg-ace-rose px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? "Running..." : "Inject simulated lockout"}
          </button>
        </div>
      </div>

      <TraceConsole lines={trace} />
      {showPaymentOverlay && <PaymentOverlay />}
    </motion.div>
  );
}
