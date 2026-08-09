import { CheckoutResult } from "../../components/checkout-result";
import { hasOrderAccess } from "../../lib/order-access";
import { isValidOrderId } from "../../lib/security";

export default async function ExpiredPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  const visibleOrderId = order_id && isValidOrderId(order_id) && await hasOrderAccess(order_id) ? order_id : undefined;
  return <CheckoutResult kind="expired" orderId={visibleOrderId} />;
}
