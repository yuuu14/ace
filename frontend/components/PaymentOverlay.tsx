"use client";

import { motion } from "framer-motion";

export default function PaymentOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Nanopayment in progress"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-80 rounded-2xl border border-ace-cyan/30 bg-ace-panel/90 p-6 text-center shadow-2xl"
      >
        <div className="mb-4 flex justify-center" aria-hidden="true">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="h-10 w-10 rounded-full border-2 border-ace-cyan border-t-transparent"
          />
        </div>
        <h3 className="mb-2 text-sm font-bold text-white">EIP-712 Nanopayment</h3>
        <p className="text-xs leading-relaxed text-ace-muted">
          Signing TransferWithAuthorization off-chain and settling via Circle Gateway...
        </p>
        <div className="mt-4 rounded bg-black/40 px-3 py-2 font-mono text-[10px] text-ace-cyan">
          x402 • USDC • Arc testnet
        </div>
      </motion.div>
    </div>
  );
}
