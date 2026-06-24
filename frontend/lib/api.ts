import type {
  Capability,
  CapabilitySummary,
  EIP712Authorization,
  LedgerEntry,
  PaymentSignaturePayload,
  ResolveResponse,
  SavingsReport,
  RuntimeStatus,
  X402Accept,
  X402Challenge,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function b64decode(s: string): string {
  return decodeURIComponent(escape(atob(s)));
}

function b64encode(obj: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function randomNonceHex(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return "0x" + Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function listCapabilities(): Promise<CapabilitySummary[]> {
  return fetchJson<CapabilitySummary[]>("/capabilities");
}

export async function getCapability(id: string): Promise<Capability> {
  return fetchJson<Capability>(`/capabilities/${id}`);
}

export async function resolveIncident(errorCode: string, logSnippet: string): Promise<ResolveResponse> {
  return fetchJson<ResolveResponse>("/agent/resolve", {
    method: "POST",
    body: JSON.stringify({
      incident: { error_code: errorCode, log_snippet: logSnippet, service: "circle-wallet" },
    }),
  });
}

export async function purchaseCapability(id: string): Promise<unknown> {
  return fetchJson<unknown>(`/agent/purchase/${id}`, { method: "POST" });
}

export interface PaywallDownloadResult {
  capability: Capability;
  challenge: X402Challenge;
  payload: { signature: string; authorization: EIP712Authorization };
}

export async function paywallDownload(
  id: string,
  signer?: (typedData: unknown) => Promise<string>,
): Promise<PaywallDownloadResult> {
  const challengeRes = await fetch(`${API_BASE}/capabilities/${id}/download`);
  if (challengeRes.status !== 402) {
    const cap = await challengeRes.json();
    return { capability: cap as Capability, challenge: {} as X402Challenge, payload: { signature: "", authorization: {} as EIP712Authorization } };
  }

  const header = challengeRes.headers.get("PAYMENT-REQUIRED");
  if (!header) throw new Error("Missing PAYMENT-REQUIRED header");
  const challenge: X402Challenge = JSON.parse(b64decode(header));
  const accepted: X402Accept = challenge.accepts[0];
  const chainId = parseInt(accepted.network.split(":")[1], 10);
  const now = Math.floor(Date.now() / 1000);
  const buyer = "0x000000000000000000000000000000000000ACE0";

  const authorization: EIP712Authorization = {
    from: buyer,
    to: accepted.payTo,
    value: accepted.amount,
    validAfter: String(now - 600),
    validBefore: String(now + Math.max(accepted.maxTimeoutSeconds, 7 * 24 * 3600 + 600)),
    nonce: randomNonceHex(),
  };

  const typedData = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    domain: {
      name: "GatewayWalletBatched",
      version: "1",
      chainId,
      verifyingContract: accepted.extra.verifyingContract,
    },
    message: authorization,
  };

  let signature = signer ? await signer(typedData) : "";
  let paymentPayload: unknown = null;

  if (signature) {
    paymentPayload = {
      x402Version: 2,
      payload: { signature, authorization },
      accepted,
      resource: challenge.resource,
    };
  } else {
    const purchase = (await purchaseCapability(id)) as {
      payment_signature?: {
        payload?: { signature?: string; authorization?: EIP712Authorization };
      };
    };
    paymentPayload = purchase.payment_signature;
    signature = purchase.payment_signature?.payload?.signature || "";
  }

  const paidRes = await fetch(`${API_BASE}/capabilities/${id}/download`, {
    headers: { "payment-signature": b64encode(paymentPayload) },
  });

  if (!paidRes.ok) {
    const text = await paidRes.text();
    throw new Error(`Payment failed: ${paidRes.status} ${text}`);
  }

  const capability = (await paidRes.json()) as Capability;
  return {
    capability,
    challenge,
    payload: {
      signature,
      authorization:
        ((paymentPayload as PaymentSignaturePayload | null)?.payload.authorization as EIP712Authorization | undefined) ||
        authorization,
    },
  };
}

export async function listLedger(): Promise<LedgerEntry[]> {
  return fetchJson<LedgerEntry[]>("/ledger");
}

export async function getSavings(): Promise<SavingsReport> {
  return fetchJson<SavingsReport>("/ledger/savings");
}

export async function getRuntime(): Promise<RuntimeStatus> {
  return fetchJson<RuntimeStatus>("/runtime");
}
