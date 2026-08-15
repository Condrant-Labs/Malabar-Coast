import type { OrderRecord } from "../orders";

export type StripeCheckoutSession = {
  id?: string;
  client_reference_id?: string;
  payment_status?: string;
  status?: string;
  amount_total?: number;
  currency?: string;
  payment_intent?: string | { id?: string } | null;
  metadata?: { orderId?: string };
};

export function isStripeConfigured() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return Boolean(secret && /^(?:sk|rk)_(?:test|live)_/.test(secret) && webhookSecret?.startsWith("whsec_"));
}

export function isStripeProductionReady() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return Boolean(secret && /^(?:sk|rk)_live_/.test(secret) && webhookSecret?.startsWith("whsec_"));
}

export async function createStripeCheckout(order: OrderRecord, baseUrl: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured.");

  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${baseUrl}/checkout/success?order_id=${order.id}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancelled?order_id=${order.id}`,
    client_reference_id: order.id,
    customer_email: order.customer.email,
    "metadata[orderId]": order.id,
    "payment_intent_data[metadata][orderId]": order.id,
  });

  order.lines.forEach((line, index) => {
    params.set(`line_items[${index}][quantity]`, String(line.quantity));
    params.set(`line_items[${index}][price_data][currency]`, "gbp");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitPricePence));
    params.set(`line_items[${index}][price_data][product_data][name]`, line.name);
    if (line.note) params.set(`line_items[${index}][price_data][product_data][description]`, `Note: ${line.note}`);
  });
  if (order.deliveryFeePence > 0) {
    const index = order.lines.length;
    params.set(`line_items[${index}][quantity]`, "1");
    params.set(`line_items[${index}][price_data][currency]`, "gbp");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(order.deliveryFeePence));
    params.set(`line_items[${index}][price_data][product_data][name]`, "Delivery");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": order.id },
    body: params,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !result.id || !result.url) throw new Error(result.error?.message || "Stripe could not start checkout.");
  return { providerReference: result.id, redirectUrl: result.url };
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<StripeCheckoutSession | null> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !/^cs_(?:test|live)_[A-Za-z0-9]{10,}$/.test(sessionId)) return null;
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Stripe session lookup failed (${response.status}).`);
  return response.json() as Promise<StripeCheckoutSession>;
}

export async function retrieveStripeCheckoutSessionForPaymentIntent(paymentIntentId: string): Promise<StripeCheckoutSession | null> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !/^pi_[A-Za-z0-9]{10,}$/.test(paymentIntentId)) return null;
  const query = new URLSearchParams({ payment_intent: paymentIntentId, limit: "1" });
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions?${query}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Stripe payment lookup failed (${response.status}).`);
  const result = await response.json() as { data?: StripeCheckoutSession[] };
  return result.data?.[0] ?? null;
}

export function stripeSessionMatchesOrder(session: StripeCheckoutSession, order: OrderRecord) {
  return (!order.providerReference || session.id === order.providerReference)
    && session.client_reference_id === order.id
    && session.metadata?.orderId === order.id
    && session.amount_total === order.totalPence
    && session.currency?.toUpperCase() === order.currency;
}

export async function verifyStripeCheckoutSession(sessionId: string, order: OrderRecord) {
  try {
    const session = await retrieveStripeCheckoutSession(sessionId);
    return Boolean(session && stripeSessionMatchesOrder(session, order) && session.payment_status === "paid");
  } catch {
    return false;
  }
}
