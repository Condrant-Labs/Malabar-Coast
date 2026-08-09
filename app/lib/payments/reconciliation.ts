import { applyPaymentEvent } from "../order-store";
import { inferPaymentStatus, type OrderRecord } from "../orders";
import { retrieveStripeCheckoutSession, stripeSessionMatchesOrder } from "./stripe";
import { retrieveWorldpayPaymentForOrder } from "./worldpay";

const reconcilableStatuses = new Set(["pending", "failed"]);

export async function reconcileOrderPayment(order: OrderRecord) {
  if (!reconcilableStatuses.has(inferPaymentStatus(order))) return false;

  if (order.provider === "stripe") {
    if (!order.providerReference) return false;
    const session = await retrieveStripeCheckoutSession(order.providerReference);
    if (!session || !session.id || !stripeSessionMatchesOrder(session, order)) return false;
    const paymentStatus = session.payment_status === "paid"
      ? "paid"
      : session.status === "expired"
        ? "expired"
        : undefined;
    if (!paymentStatus || session.amount_total === undefined || !session.currency) return false;
    return applyPaymentEvent({
      provider: "stripe",
      eventId: `query:${session.id}:${session.payment_status || "unknown"}:${session.status || "unknown"}`,
      orderId: order.id,
      paymentStatus,
      outcome: `checkout_query:${session.payment_status || session.status || "unknown"}`,
      providerReference: session.id,
      amountPence: session.amount_total,
      currency: session.currency,
    });
  }

  const payment = await retrieveWorldpayPaymentForOrder(order);
  if (!payment) return false;
  return applyPaymentEvent({ provider: "worldpay", orderId: order.id, ...payment });
}
