import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Stripe uses a server-created hosted checkout redirect", async () => {
  const [checkout, stripe, form, config] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/payment-config/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /createStripeCheckout/);
  assert.match(stripe, /checkout\/sessions/);
  assert.doesNotMatch(form, /choose.*provider/i);
  assert.match(config, /stripe: isStripeConfigured\(\)/);
});

test("a realtime notification failure cannot fail a recorded payment", async () => {
  const publisher = await readFile(new URL("../app/lib/publishEvent.ts", import.meta.url), "utf8");
  assert.match(publisher, /return false/);
  assert.doesNotMatch(publisher, /throw new Error/);
});

test("production readiness requires live Stripe credentials", async () => {
  const [readiness, stripe] = await Promise.all([
    readFile(new URL("../app/api/health/ready/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/payments/stripe.ts", import.meta.url), "utf8"),
  ]);
  assert.match(readiness, /stripePayments: isStripeProductionReady\(\)/);
  assert.match(stripe, /\(\?:sk\|rk\)_live_/);
});
