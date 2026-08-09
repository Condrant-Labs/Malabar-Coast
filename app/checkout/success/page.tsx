import { CheckoutResult } from "../../components/checkout-result";
import { hasOrderAccess } from "../../lib/order-access";
import { getOrder } from "../../lib/order-store";
import { isPaymentConfirmed } from "../../lib/orders";
import { reconcileOrderPayment } from "../../lib/payments/reconciliation";
import { isValidOrderId } from "../../lib/security";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string; session_id?: string }> }) {
  const { order_id, session_id } = await searchParams;
  if (!order_id || !isValidOrderId(order_id) || !(await hasOrderAccess(order_id))) return <CheckoutResult kind="pending" />;
  let order = await getOrder(order_id);
  const returnMatchesOrder = order?.provider !== "stripe" || Boolean(session_id && session_id === order.providerReference);
  if (order && returnMatchesOrder && !isPaymentConfirmed(order)) {
    try {
      await reconcileOrderPayment(order);
      order = await getOrder(order_id);
    } catch {
      // Provider query services can lag behind the redirect. Webhooks remain the
      // primary path, so an unavailable lookup renders pending rather than paid.
    }
  }
  const confirmed = Boolean(order && isPaymentConfirmed(order));
  return <CheckoutResult kind={confirmed ? "success" : "pending"} orderId={order?.id} />;
}
