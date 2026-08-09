import type { OrderRecord, PaymentStatus } from "../orders";

const HPP_MEDIA_TYPE = "application/vnd.worldpay.payment_pages-v1.hal+json";

type WorldpayHostedPaymentResponse = {
  url?: string;
  _links?: { self?: { href?: string } };
  description?: string;
  message?: string;
};

export type WorldpayPaymentSummary = {
  paymentId?: string;
  transactionReference?: string;
  lastEvent?: string;
  value?: { amount?: number; currency?: string };
};

function credentials() {
  const username = process.env.WORLDPAY_USERNAME?.trim();
  const password = process.env.WORLDPAY_PASSWORD;
  const entity = process.env.WORLDPAY_MERCHANT_ENTITY?.trim();
  return { username, password, entity };
}

function apiOrigin() {
  return process.env.WORLDPAY_ENVIRONMENT === "live"
    ? "https://access.worldpay.com"
    : "https://try.access.worldpay.com";
}

function authorizationHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function isSecureUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2_048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isWorldpayWebhookSignatureConfigured() {
  return Boolean(process.env.WORLDPAY_WEBHOOK_SECRET?.trim());
}

export function isWorldpayCheckoutEnabled() {
  const { username, password, entity } = credentials();
  const coreReady = process.env.WORLDPAY_CHECKOUT_ENABLED === "true"
    && Boolean(username && password && entity);

  // A local Try integration can be exercised before Worldpay boards the webhook.
  // Live and production checkout fail closed unless event authenticity is configured.
  if (process.env.WORLDPAY_ENVIRONMENT === "live" || process.env.NODE_ENV === "production") {
    return coreReady && isWorldpayWebhookSignatureConfigured();
  }
  return coreReady;
}

export function isWorldpayProductionReady() {
  const { username, password, entity } = credentials();
  return process.env.WORLDPAY_CHECKOUT_ENABLED === "true"
    && Boolean(username && password && entity)
    && isWorldpayWebhookSignatureConfigured();
}

export async function createWorldpayHostedPayment(order: OrderRecord, baseUrl: string) {
  const { username, password, entity } = credentials();
  if (!username || !password || !entity) throw new Error("Worldpay Hosted Payment Pages are not configured.");

  const successUrl = `${baseUrl}/checkout/success?order_id=${encodeURIComponent(order.id)}&provider=worldpay`;
  const response = await fetch(`${apiOrigin()}/payment_pages`, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader(username, password),
      "Content-Type": HPP_MEDIA_TYPE,
      Accept: HPP_MEDIA_TYPE,
    },
    body: JSON.stringify({
      transactionReference: order.id,
      merchant: { entity },
      narrative: { line1: (process.env.WORLDPAY_NARRATIVE || "Malabar Coast").trim().slice(0, 24) },
      value: { currency: order.currency, amount: order.totalPence },
      description: `Restaurant order ${order.id}`.slice(0, 128),
      expiry: 1_800,
      resultURLs: {
        successURL: successUrl,
        pendingURL: successUrl,
        failureURL: `${baseUrl}/checkout/failure?order_id=${encodeURIComponent(order.id)}`,
        errorURL: `${baseUrl}/checkout/failure?order_id=${encodeURIComponent(order.id)}`,
        cancelURL: `${baseUrl}/checkout/cancelled?order_id=${encodeURIComponent(order.id)}`,
        expiryURL: `${baseUrl}/checkout/expired?order_id=${encodeURIComponent(order.id)}`,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as WorldpayHostedPaymentResponse;
  if (!response.ok || !isSecureUrl(result.url)) {
    throw new Error(result.description || result.message || "Worldpay could not start hosted checkout.");
  }
  return { redirectUrl: result.url!, queryUrl: isSecureUrl(result._links?.self?.href) ? result._links!.self!.href : undefined };
}

export function resolveWorldpayQueryPaymentStatus(lastEvent: string): PaymentStatus | undefined {
  const normalized = lastEvent.toLowerCase().replace(/[^a-z]/g, "");
  if (["authorizationsucceeded", "salesucceeded", "settlementsucceeded"].includes(normalized)) return "paid";
  if (["authorizationrefused", "authorizationfailed", "salerefused", "salefailed"].includes(normalized)) return "failed";
  if (["cancellationsucceeded", "paymentscancelled"].includes(normalized)) return "cancelled";
  if (["settlementfailed", "reversalsucceeded"].includes(normalized)) return "reversed";
  return undefined;
}

export async function retrieveWorldpayPaymentForOrder(order: OrderRecord) {
  const { username, password } = credentials();
  if (!username || !password || order.provider !== "worldpay") return null;
  const query = new URLSearchParams({ transactionReference: order.id });
  const response = await fetch(`${apiOrigin()}/paymentQueries/payments?${query}`, {
    headers: {
      Authorization: authorizationHeader(username, password),
      Accept: "application/vnd.worldpay.payment-queries-v1.hal+json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Worldpay payment query failed (${response.status}).`);

  const result = await response.json() as { _embedded?: { payments?: WorldpayPaymentSummary[] } };
  const matches = (result._embedded?.payments || []).filter((payment) =>
    payment.transactionReference === order.id
    && typeof payment.paymentId === "string"
    && payment.value?.amount === order.totalPence
    && payment.value.currency?.toUpperCase() === order.currency
    && (!order.providerReference || payment.paymentId === order.providerReference),
  );
  if (matches.length !== 1) return null;
  const payment = matches[0];
  const paymentStatus = payment.lastEvent ? resolveWorldpayQueryPaymentStatus(payment.lastEvent) : undefined;
  if (!payment.paymentId || !payment.lastEvent || !paymentStatus || !payment.value?.currency) return null;
  return {
    providerReference: payment.paymentId,
    eventId: `query:${payment.paymentId}:${payment.lastEvent}`,
    outcome: `payment_query:${payment.lastEvent}`,
    paymentStatus,
    amountPence: payment.value.amount!,
    currency: payment.value.currency,
  };
}
