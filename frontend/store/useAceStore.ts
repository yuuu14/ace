import { create } from "zustand";
import type { Capability, CapabilitySummary, LedgerEntry, TraceLine } from "@/lib/types";

interface AceState {
  capabilities: CapabilitySummary[];
  selectedCapability: Capability | null;
  trace: TraceLine[];
  ledger: LedgerEntry[];
  savings: { total_saved_usdc: number; total_spent_usdc: number; settlements: number } | null;
  loading: boolean;
  alert: boolean;
  showPaymentOverlay: boolean;
  setCapabilities: (capabilities: CapabilitySummary[]) => void;
  setSelectedCapability: (capability: Capability | null) => void;
  appendTrace: (lines: TraceLine[]) => void;
  clearTrace: () => void;
  setLedger: (ledger: LedgerEntry[]) => void;
  setSavings: (savings: AceState["savings"]) => void;
  setLoading: (loading: boolean) => void;
  setAlert: (alert: boolean) => void;
  setShowPaymentOverlay: (show: boolean) => void;
}

export const useAceStore = create<AceState>((set) => ({
  capabilities: [],
  selectedCapability: null,
  trace: [],
  ledger: [],
  savings: null,
  loading: false,
  alert: false,
  showPaymentOverlay: false,
  setCapabilities: (capabilities) => set({ capabilities }),
  setSelectedCapability: (selectedCapability) => set({ selectedCapability }),
  appendTrace: (lines) => set((state) => ({ trace: [...state.trace, ...lines] })),
  clearTrace: () => set({ trace: [] }),
  setLedger: (ledger) => set({ ledger }),
  setSavings: (savings) => set({ savings }),
  setLoading: (loading) => set({ loading }),
  setAlert: (alert) => set({ alert }),
  setShowPaymentOverlay: (showPaymentOverlay) => set({ showPaymentOverlay }),
}));
