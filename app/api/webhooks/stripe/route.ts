import { createHmac, timingSafeEqual } from "node:crypto";
import { applyPaymentEvent, getOrder } from "../../../lib/order-store";
import { inferPaymentStatus, type PaymentStatus } from "../../../lib/orders";
import {
  retrieveStripeCheckoutSession,
  retrieveStripeCheckoutSessionForPaymentIntent,
  stripeSessionMatchesOrder,
  type StripeCheckoutSession,
} from "../../../lib/payments/stripe";
import { isValidOrderId, noStoreJson, readLimitedText, RequestBodyTooLargeError } from "../../../lib/security";
import { publishPaymentCompletionEvent } from "@/app/lib/publishEvent";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const values = signatureHeader.split(",").reduce<Record<string, string[]>>((all, part) => {
    const [key, value] = part.split("=");
    if (key && value) (all[key] ||= []).push(value);
    return all;
  }, {});
  const timestamp = values.t?.[0];
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return (values.v1 || []).some((candidate) => {
    if (!/^[a-f0-9]{64}$/i.test(candidate) || candidate.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expected, "hex"));
  });
}

type StripeEventObject = {
  id?: string;
  client_reference_id?: string;
  payment_status?: string;
  status?: string;
  amount?: number;
  amount_refunded?: number;
  currency?: string;
  payment_intent?: string | { id?: string } | null;
  metadata?: { orderId?: string };
};

function paymentIntentId(object: StripeEventObject) {
  return typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id;
}

async function verifiedSession(eventType: string, object: StripeEventObject): Promise<StripeCheckoutSession | null> {
  if (eventType.startsWith("checkout.session.")) return object.id ? retrieveStripeCheckoutSession(object.id) : null;
  if (eventType === "payment_intent.canceled") return object.id ? retrieveStripeCheckoutSessionForPaymentIntent(object.id) : null;
  const intentId = paymentIntentId(object);
  return intentId ? retrieveStripeCheckoutSessionForPaymentIntent(intentId) : null;
}

function paymentStatusFor(eventType: string, object: StripeEventObject, session: StripeCheckoutSession): PaymentStatus | undefined {
  if (eventType === "checkout.session.completed") return session.payment_status === "paid" ? "paid" : "pending";
  if (eventType === "checkout.session.async_payment_succeeded") return session.payment_status === "paid" ? "paid" : undefined;
  if (eventType === "checkout.session.async_payment_failed") return "failed";
  if (eventType === "checkout.session.expired") return "expired";
  if (eventType === "payment_intent.canceled") return "cancelled";
  if (eventType === "charge.refunded") {
    return Number(object.amount_refunded) >= Number(object.amount) ? "refunded" : "partially_refunded";
  }
  if (eventType === "charge.dispute.created") return "disputed";
  if (eventType === "charge.dispute.closed") return object.status === "lost" ? "reversed" : "disputed";
  return undefined;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return noStoreJson({ error: "Stripe webhook is not configured." }, { status: 503 });

  let payload: string;
  try {
    payload = await readLimitedText(request, 1_000_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return noStoreJson({ error: "Payload too large." }, { status: 413 });
    return noStoreJson({ error: "Webhook body could not be read." }, { status: 400 });
  }
  const signature = request.headers.get("stripe-signature") || "";
  if (!verifyStripeSignature(payload, signature, secret)) return noStoreJson({ error: "Invalid signature." }, { status: 400 });

  let event: { id?: string; type?: string; data?: { object?: StripeEventObject } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return noStoreJson({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const object = event.data?.object;
  if (!object || !event.id || event.id.length > 180 || !event.type) return noStoreJson({ received: true });

  let session: StripeCheckoutSession | null;
  try {
    session = await verifiedSession(event.type, object);
  } catch (error) {
    console.error("Stripe webhook verification lookup failed.", error instanceof Error ? error.message : "UnknownError");
    return noStoreJson({ error: "Payment verification is temporarily unavailable." }, { status: 503 });
  }
  const orderId = session?.client_reference_id || session?.metadata?.orderId;
  if (!session || !orderId || !isValidOrderId(orderId)) return noStoreJson({ received: true });

  const order = await getOrder(orderId);
  if (!order || order.provider !== "stripe" || !stripeSessionMatchesOrder(session, order)) {
    console.warn("Rejected a Stripe event that did not match its stored order.", event.id);
    return noStoreJson({ received: true });
  }
  const paymentStatus = paymentStatusFor(event.type, object, session);
  if (paymentStatus && session.id && session.amount_total !== undefined && session.currency) {
    const applied = await applyPaymentEvent({
      provider: "stripe",
      eventId: event.id,
      orderId,
      paymentStatus,
      outcome: event.type,
      providerReference: session.id,
      amountPence: session.amount_total,
      currency: session.currency,
    });
    if (applied && paymentStatus==="paid" && inferPaymentStatus(order) !== "paid"){
      const updatedOrder = await getOrder(orderId);
      if (updatedOrder) await publishPaymentCompletionEvent(updatedOrder);
    }
  }
  return noStoreJson({ received: true });
}
