import { getDeliveryFeePence } from "../../lib/orders";
import { isStripeConfigured } from "../../lib/payments/stripe";
import { noStoreJson } from "../../lib/security";

export const dynamic = "force-dynamic";

export function GET() {
  return noStoreJson({
    stripe: isStripeConfigured(),
    deliveryFeePence: getDeliveryFeePence(),
  });
}
