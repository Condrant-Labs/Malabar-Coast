import { applyPaymentEvent } from "../order-store";
import { inferPaymentStatus, type OrderRecord } from "../orders";
import { publishPaymentCompletionEvent } from "../publishEvent";
import { notifyPaidOrder } from "../email/notifications";
import { retrieveStripeCheckoutSession, stripeSessionMatchesOrder } from "./stripe";

const reconcilableStatuses = new Set(["pending", "failed"]);

export async function reconcileOrderPayment(order: OrderRecord) {
  if (!reconcilableStatuses.has(inferPaymentStatus(order))) return false;

  if (!order.providerReference) return false;
  const session = await retrieveStripeCheckoutSession(order.providerReference);
  if (!session || !session.id || !stripeSessionMatchesOrder(session, order)) return false;
  const paymentStatus = session.payment_status === "paid"
    ? "paid"
    : session.status === "expired"
      ? "expired"
      : undefined;
  if (!paymentStatus || session.amount_total === undefined || !session.currency) return false;
  const applied = await applyPaymentEvent({
    provider: "stripe",
    eventId: `query:${session.id}:${session.payment_status || "unknown"}:${session.status || "unknown"}`,
    orderId: order.id,
    paymentStatus,
    outcome: `checkout_query:${session.payment_status || session.status || "unknown"}`,
    providerReference: session.id,
    amountPence: session.amount_total,
    currency: session.currency,
  });
  if (paymentStatus === "paid" && applied && inferPaymentStatus(order) !== "paid") {
    await publishPaymentCompletionEvent(order.id);
    await notifyPaidOrder(order);
  }
  return applied;
}
