import { create } from "zustand";
import type {
  Capability,
  CapabilitySummary,
  LedgerEntry,
  TraceLine,
} from "@/lib/types";
import { listCapabilities, getCapability, listLedger, getSavings } from "@/lib/api";

export interface LiveAnalysis {
  summary?: string | null;
  rationale?: string | null;
  confidence?: number | null;
  provider?: string | null;
}

interface AceState {
  // Data
  capabilities: CapabilitySummary[];
  liveAnalysis: LiveAnalysis | null;
  selectedCapability: Capability | null;
  trace: TraceLine[];
  ledger: LedgerEntry[];
  savings: { total_saved_usdc: number; total_spent_usdc: number; settlements: number } | null;

  // Loading / Error per section
  loading: { capabilities: boolean; ledger: boolean; savings: boolean; sandbox: boolean };
  error: { capabilities: string | null; ledger: string | null; savings: string | null; sandbox: string | null };

  // UI
  alert: boolean;
  showPaymentOverlay: boolean;
  filterCategory: string | null;
  searchQuery: string;

  // Actions
  setCapabilities: (capabilities: CapabilitySummary[]) => void;
  setSelectedCapability: (capability: Capability | null) => void;
  fetchSelectedCapability: (id: string) => Promise<void>;
  appendTrace: (lines: TraceLine[]) => void;
  clearTrace: () => void;
  setLedger: (ledger: LedgerEntry[]) => void;
  setSavings: (savings: AceState["savings"]) => void;
  setLiveAnalysis: (v: LiveAnalysis | null) => void;
  setLoading: (key: keyof AceState["loading"], value: boolean) => void;
  setError: (key: keyof AceState["error"], value: string | null) => void;
  setAlert: (alert: boolean) => void;
  setShowPaymentOverlay: (show: boolean) => void;
  setFilterCategory: (cat: string | null) => void;
  setSearchQuery: (q: string) => void;
  fetchAll: () => Promise<void>;
  resetAll: () => void;
}

const MAX_TRACE = 200;

const initialLoading = { capabilities: false, ledger: false, savings: false, sandbox: false };
const initialError = { capabilities: null, ledger: null, savings: null, sandbox: null };

export const useAceStore = create<AceState>((set, get) => ({
  capabilities: [],
  selectedCapability: null,
  trace: [],
  ledger: [],
  savings: null,
  liveAnalysis: null,
  loading: { ...initialLoading },
  error: { ...initialError },
  alert: false,
  showPaymentOverlay: false,
  filterCategory: null,
  searchQuery: "",

  setCapabilities: (capabilities) => set({ capabilities }),
  setSelectedCapability: (selectedCapability) => set({ selectedCapability }),

  fetchSelectedCapability: async (id: string) => {
    try {
      const cap = await getCapability(id);
      set({ selectedCapability: cap });
    } catch (err) {
      console.error("fetchSelectedCapability:", err);
    }
  },

  appendTrace: (lines) =>
    set((state) => ({
      trace: [...state.trace, ...lines].slice(-MAX_TRACE),
    })),
  clearTrace: () => set({ trace: [], liveAnalysis: null, alert: false, showPaymentOverlay: false }),
  setLedger: (ledger) => set({ ledger }),
  setSavings: (savings) => set({ savings }),
  setLiveAnalysis: (liveAnalysis) => set({ liveAnalysis }),
  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),
  setError: (key, value) =>
    set((state) => ({ error: { ...state.error, [key]: value } })),
  setAlert: (alert) => set({ alert }),
  setShowPaymentOverlay: (showPaymentOverlay) => set({ showPaymentOverlay }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  fetchAll: async () => {
    set({ loading: { capabilities: true, ledger: true, savings: true, sandbox: false } });
    const errs: AceState["error"] = { ...initialError };

    try {
      const caps = await listCapabilities();
      set({ capabilities: caps });
    } catch (e: unknown) {
      errs.capabilities = e instanceof Error ? e.message : "Failed to load capabilities";
    }

    try {
      const l = await listLedger();
      set({ ledger: l });
    } catch (e: unknown) {
      errs.ledger = e instanceof Error ? e.message : "Failed to load ledger";
    }

    try {
      const s = await getSavings();
      set({ savings: s });
    } catch (e: unknown) {
      errs.savings = e instanceof Error ? e.message : "Failed to load savings";
    }

    set({ loading: { capabilities: false, ledger: false, savings: false, sandbox: false }, error: errs });
  },

  resetAll: () =>
    set({
      trace: [],
      selectedCapability: null,
      liveAnalysis: null,
      alert: false,
      showPaymentOverlay: false,
      error: { ...initialError },
    }),
}));
