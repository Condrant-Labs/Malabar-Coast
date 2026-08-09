import { getDeliveryFeePence } from "../../lib/orders";
import { isStripeConfigured } from "../../lib/payments/stripe";
import { isWorldpayCheckoutEnabled } from "../../lib/payments/worldpay";
import { noStoreJson } from "../../lib/security";

export const dynamic = "force-dynamic";

export function GET() {
  return noStoreJson({
    stripe: isStripeConfigured(),
    worldpay: isWorldpayCheckoutEnabled(),
    deliveryFeePence: getDeliveryFeePence(),
  });
}
