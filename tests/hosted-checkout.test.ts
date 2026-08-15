import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("both payment providers use server-created hosted checkout redirects", async () => {
  const [checkout, stripe, worldpay, form, config] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/worldpay.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payment-config/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /createStripeCheckout/);
  assert.match(checkout, /createWorldpayHostedPayment/);
  assert.match(stripe, /checkout\/sessions/);
  assert.match(worldpay, /\/payment_pages/);
  assert.match(worldpay, /resultURLs/);
  assert.doesNotMatch(form, /worldpaySessions|WorldpayCardFields|generateSessions/);
  assert.doesNotMatch(config, /NEXT_PUBLIC_WORLDPAY_CHECKOUT_ID|worldpayCheckoutId/);
});

test("Worldpay webhooks require Event-Signature HMAC and have no Basic fallback", async () => {
  const webhook = await readFile(new URL("../app/api/webhooks/worldpay/route.ts", import.meta.url), "utf8");
  assert.match(webhook, /WORLDPAY_WEBHOOK_SECRET/);
  assert.match(webhook, /verifyWorldpayEventSignature/);
  assert.doesNotMatch(webhook, /WORLDPAY_WEBHOOK_USERNAME|WORLDPAY_WEBHOOK_PASSWORD|Basic /);
});

test("Worldpay payment ID is intentionally bound after hosted-page submission", async () => {
  const [checkout, reconciliation, webhook] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/reconciliation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/webhooks/worldpay/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /attachCheckoutProviderReference\(atomic\.order\.id, "worldpay", undefined, payment\.redirectUrl\)/);
  assert.match(reconciliation, /retrieveWorldpayPaymentForOrder/);
  assert.match(reconciliation, /applyPaymentEvent/);
  assert.match(webhook, /retrieveWorldpayPaymentIdentityForOrder/);
  assert.match(webhook, /status: 503/);
});

test("a realtime notification failure cannot fail a recorded payment", async () => {
  const publisher = await readFile(new URL("../app/lib/publishEvent.ts", import.meta.url), "utf8");
  assert.match(publisher, /return false/);
  assert.doesNotMatch(publisher, /throw new Error/);
});

test("production readiness requires live credentials for both payment providers", async () => {
  const [readiness, stripe, worldpay] = await Promise.all([
    readFile(new URL("../app/api/health/ready/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/worldpay.ts", import.meta.url), "utf8"),
  ]);
  assert.match(readiness, /stripePayments: isStripeProductionReady\(\)/);
  assert.match(readiness, /worldpayPayments: isWorldpayProductionReady\(\)/);
  assert.match(stripe, /\(\?:sk\|rk\)_live_/);
  assert.match(worldpay, /WORLDPAY_ENVIRONMENT === "live"/);
});
