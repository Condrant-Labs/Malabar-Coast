import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentStatus } from "../orders";

// Worldpay Access event types are matched exactly. Substring matching previously read
// `refundFailed` and `sentForRefund` as a completed refund, which is an irreversible
// state, and never recognised `sentForSettlement`. `null` means the event is known but
// carries no payment state change; an unknown type is also ignored, so a future provider
// event can never be guessed into a terminal state.
const worldpayEventPaymentStatus: Record<string, PaymentStatus | null> = {
  sentforauthorization: null,
  authorized: "paid",
  sentforsettlement: "paid",
  settled: "paid",
  refused: "failed",
  error: "failed",
  expired: "expired",
  cancelled: "cancelled",
  sentforcancellation: null,
  settlementfailed: "reversed",
  sentforrefund: null,
  refundrequested: null,
  refunded: "refunded",
  refundedbythirdparty: "refunded",
  refundfailed: null,
  sentforpartialrefund: null,
  partiallyrefunded: "partially_refunded",
  chargedback: "disputed",
  chargeback: "disputed",
  disputed: "disputed",
  chargebackreversed: null,
};

export function resolveWorldpayPaymentStatus(eventType: string): PaymentStatus | undefined {
  const normalized = eventType.toLowerCase().replace(/[^a-z]/g, "");
  if (!(normalized in worldpayEventPaymentStatus)) return undefined;
  return worldpayEventPaymentStatus[normalized] ?? undefined;
}

export function isKnownWorldpayEventType(eventType: string) {
  return eventType.toLowerCase().replace(/[^a-z]/g, "") in worldpayEventPaymentStatus;
}

// Worldpay reports the amount under `value`, so reading a bare `amount` field left the
// value check in apply_order_payment_event with nothing to compare.
function valueContainers(details: Record<string, unknown>, event: Record<string, unknown>) {
  return [details.amount, event.amount, details.value, event.value, details, event];
}

export function resolveWorldpayAmount(details: Record<string, unknown>, event: Record<string, unknown>) {
  for (const container of valueContainers(details, event)) {
    if (!container || typeof container !== "object") continue;
    const candidate = container as Record<string, unknown>;
    const amount = candidate.amount ?? candidate.value;
    if (typeof amount === "number" && Number.isInteger(amount) && amount >= 0) return amount;
  }
  return undefined;
}

export function resolveWorldpayCurrency(details: Record<string, unknown>, event: Record<string, unknown>) {
  for (const container of valueContainers(details, event)) {
    if (!container || typeof container !== "object") continue;
    const candidate = container as Record<string, unknown>;
    const currency = candidate.currency ?? candidate.currencyCode;
    if (typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency)) return currency;
  }
  return undefined;
}

function decodeSignature(value: string) {
  if (/^[a-f0-9]{64}$/i.test(value)) return Buffer.from(value, "hex");
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
    return decoded.length === 32 ? decoded : null;
  } catch {
    return null;
  }
}

export function verifyWorldpayEventSignature(payload: string, signatureHeader: string, secret: string) {
  if (!payload || !signatureHeader || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return signatureHeader.split(",").some((entry) => {
    const match = entry.trim().replace(/^Event-Signature:/i, "").match(/^\d+\/SHA256\/(.+)$/i);
    const candidate = match ? decodeSignature(match[1]) : null;
    return Boolean(candidate && candidate.length === expected.length && timingSafeEqual(candidate, expected));
  });
}
