import { publishPaymentCompletionEvent } from "@/app/lib/publishEvent";
import { applyPaymentEvent, getOrder } from "../../../lib/order-store";
import {
  isKnownWorldpayEventType,
  resolveWorldpayAmount,
  resolveWorldpayCurrency,
  resolveWorldpayPaymentStatus,
  verifyWorldpayEventSignature,
} from "../../../lib/payments/worldpay-events";
import { noStoreJson, readLimitedText, RequestBodyTooLargeError, isValidOrderId } from "../../../lib/security";
import { inferPaymentStatus } from "@/app/lib/orders";
import { retrieveWorldpayPaymentIdentityForOrder } from "../../../lib/payments/worldpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: string;
  try {
    payload = await readLimitedText(request, 1_000_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return noStoreJson({ error: "Payload too large." }, { status: 413 });
    return noStoreJson({ error: "Webhook body could not be read." }, { status: 400 });
  }

  const signatureSecret = process.env.WORLDPAY_WEBHOOK_SECRET?.trim();
  if (!signatureSecret) return noStoreJson({ error: "Worldpay webhook signature is not configured." }, { status: 503 });
  if (!verifyWorldpayEventSignature(payload, request.headers.get("event-signature") || "", signatureSecret)) {
    return noStoreJson({ error: "Invalid signature." }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: "Invalid JSON payload." }, { status: 400 });
  }
  const details = event.eventDetails && typeof event.eventDetails === "object" ? event.eventDetails as Record<string, unknown> : event;
  if (details.classification && details.classification !== "payment") return noStoreJson({ received: true });

  const orderId = [details.transactionReference, event.transactionReference].find((value) => typeof value === "string") as string | undefined;
  const eventId = [event.eventId, event.id].find((value) => typeof value === "string") as string | undefined;
  const providerReference = [details.paymentId, event.paymentId].find((value) => typeof value === "string") as string | undefined;
  const eventType = String(details.type || event.type || details.outcome || "unknown");
  if (!orderId || !isValidOrderId(orderId) || !eventId || eventId.length > 180) return noStoreJson({ received: true });

  // Unknown provider events are acknowledged but never guessed into a financial state.
  if (!isKnownWorldpayEventType(eventType)) {
    console.warn("Ignored an unmapped Worldpay event type.", eventType.slice(0, 60));
    return noStoreJson({ received: true });
  }

  const paymentStatus = resolveWorldpayPaymentStatus(eventType);
  if (paymentStatus) {
    const orderBefore = await getOrder(orderId);
    if (!orderBefore || orderBefore.provider !== "worldpay") {
      console.warn("Rejected a Worldpay event for an unknown order.", eventId);
      return noStoreJson({ received: true });
    }

    const eventAmount = resolveWorldpayAmount(details, event);
    const eventCurrency = resolveWorldpayCurrency(details, event);
    const identityRequired = ["paid", "partially_refunded", "refunded", "disputed", "reversed"].includes(paymentStatus);
    if (identityRequired) {
      const amountMatches = paymentStatus === "partially_refunded"
        ? eventAmount !== undefined && eventAmount > 0 && eventAmount < orderBefore.totalPence
        : paymentStatus === "paid" || paymentStatus === "refunded"
          ? eventAmount === orderBefore.totalPence
          : eventAmount !== undefined && eventAmount > 0 && eventAmount <= orderBefore.totalPence;
      if (!amountMatches || eventCurrency?.toUpperCase() !== orderBefore.currency) {
        console.warn("Rejected a Worldpay event with an invalid value.", eventId);
        return noStoreJson({ received: true });
      }
    }

    let verifiedReference = providerReference || orderBefore.providerReference;
    if (identityRequired && !verifiedReference) {
      try {
        const identity = await retrieveWorldpayPaymentIdentityForOrder(orderBefore);
        verifiedReference = identity?.providerReference;
      } catch (error) {
        console.error("Worldpay webhook payment identity lookup failed.", error instanceof Error ? error.name : "UnknownError");
        return noStoreJson({ error: "Payment verification is temporarily unavailable." }, { status: 503 });
      }
      // Payment Queries can lag the signed event. A retry is safer than acknowledging
      // a paid event that the identity-bound database contract must reject.
      if (!verifiedReference) {
        return noStoreJson({ error: "Payment identity is not available yet." }, { status: 503 });
      }
    }

    const applied = await applyPaymentEvent({
      provider: "worldpay",
      eventId,
      orderId,
      paymentStatus,
      outcome: eventType,
      providerReference: verifiedReference,
      // The database stores and verifies the original order value. The signed event
      // amount is separately checked above because partial-refund events carry only
      // the refunded portion rather than the original checkout total.
      amountPence: identityRequired ? orderBefore.totalPence : undefined,
      currency: identityRequired ? orderBefore.currency : undefined,
    });
    if (!applied) console.warn("Rejected a Worldpay event that did not match its stored order.", eventId);
    if (applied && paymentStatus === "paid" && inferPaymentStatus(orderBefore) !== "paid") {
      await publishPaymentCompletionEvent(orderId);
    }
  }
  return noStoreJson({ received: true });
}
