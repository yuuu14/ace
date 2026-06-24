export interface CapabilitySummary {
  id: string;
  objective: string;
  category: string;
  price_usdc: number;
  sample_runs_analyzed: number;
  average_latency_reduction_pct: number;
  direct_token_saving_pct: number;
  auditor_address: string | null;
}

export interface Capability extends CapabilitySummary {
  version: string;
  trigger_signatures: TriggerSignature[];
  provenance_metrics: ProvenanceMetrics;
  decision_points: DecisionPoint[];
  attestation: Attestation | null;
}

export interface TriggerSignature {
  error_code?: string;
  terminal_log_pattern?: string;
}

export interface ProvenanceMetrics {
  experience_sources: string[];
  sample_runs_analyzed: number;
  average_latency_reduction_pct: number;
  direct_token_saving_pct: number;
}

export interface DecisionPoint {
  condition: string;
  action: string;
  failsafe?: string;
  params?: Record<string, unknown>;
  security_policy?: string;
}

export interface Attestation {
  auditor_address: string;
  timestamp: number;
  signature: string;
}

export interface ResolveResponse {
  accepted: boolean;
  capability_id: string | null;
  price_usdc: number | null;
  estimated_direct_cost_usdc: number | null;
  savings_pct: number | null;
  decision_points: DecisionPoint[] | null;
  message: string;
}

export interface LedgerEntry {
  id: number;
  capability_id: string;
  buyer: string;
  seller: string;
  amount_usdc: number;
  tx_hash: string | null;
  status: string;
  created_at: string;
  settled_at: string | null;
}

export interface SavingsReport {
  settlements: number;
  total_spent_usdc: number;
  total_saved_usdc: number;
  reference_direct_cost_usdc: number;
}

export interface TraceLine {
  source: "ACE Console" | "Calculus" | "Lookup" | "Match" | "Payment" | "Complete" | "Error";
  text: string;
  highlight?: "rose" | "mint" | "cyan" | "muted";
}

export interface X402Accept {
  network: string;
  scheme: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    verifyingContract: string;
    token: string;
  };
}

export interface X402Challenge {
  x402Version: number;
  resource: string;
  accepts: X402Accept[];
}

export interface EIP712Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface PaymentSignaturePayload {
  x402Version: number;
  payload: {
    signature: string;
    authorization: EIP712Authorization;
  };
  accepted: X402Accept;
  resource: string;
}

export interface X402Settlement {
  settlement_id: string;
  status: string;
  tx_hash: string | null;
}
