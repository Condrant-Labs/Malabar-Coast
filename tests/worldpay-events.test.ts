import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  isKnownWorldpayEventType,
  resolveWorldpayAmount,
  resolveWorldpayCurrency,
  resolveWorldpayPaymentStatus,
  verifyWorldpayEventSignature,
} from "../app/lib/payments/worldpay-events";
import { resolveWorldpayQueryPaymentStatus } from "../app/lib/payments/worldpay";

test("a failed or in-flight Worldpay refund never becomes a completed refund", () => {
  // `refunded` is irreversible in the payment state machine, so only a confirmed refund
  // may reach it. These three event types previously all matched on the word "refund".
  assert.equal(resolveWorldpayPaymentStatus("refundFailed"), undefined);
  assert.equal(resolveWorldpayPaymentStatus("sentForRefund"), undefined);
  assert.equal(resolveWorldpayPaymentStatus("refundRequested"), undefined);
  assert.equal(resolveWorldpayPaymentStatus("refunded"), "refunded");
  assert.equal(resolveWorldpayPaymentStatus("partiallyRefunded"), "partially_refunded");
});

test("Worldpay settlement events are recognised as payment", () => {
  assert.equal(resolveWorldpayPaymentStatus("authorized"), "paid");
  assert.equal(resolveWorldpayPaymentStatus("sentForSettlement"), "paid");
  assert.equal(resolveWorldpayPaymentStatus("settled"), "paid");
  assert.equal(resolveWorldpayPaymentStatus("settlementFailed"), "reversed");
});

test("disputes are recognised and a reversed chargeback does not silently restore payment", () => {
  assert.equal(resolveWorldpayPaymentStatus("chargedBack"), "disputed");
  assert.equal(resolveWorldpayPaymentStatus("chargebackReversed"), undefined);
});

test("an unmapped Worldpay event type changes no payment state", () => {
  assert.equal(isKnownWorldpayEventType("someFutureEvent"), false);
  assert.equal(resolveWorldpayPaymentStatus("someFutureEvent"), undefined);
  assert.equal(resolveWorldpayPaymentStatus("refundedSomethingElse"), undefined);
});

test("the payment value is read from the Worldpay value object", () => {
  assert.equal(resolveWorldpayAmount({ value: { amount: 2450, currency: "GBP" } }, {}), 2450);
  assert.equal(resolveWorldpayCurrency({ value: { amount: 2450, currency: "GBP" } }, {}), "GBP");
  assert.equal(resolveWorldpayAmount({}, { amount: 2450 }), 2450);
  assert.equal(resolveWorldpayAmount({}, {}), undefined, "a missing value must not become a matching amount");
  assert.equal(resolveWorldpayAmount({ value: { amount: "24.50" } }, {}), undefined);
  assert.equal(resolveWorldpayCurrency({ value: { currency: "not-a-currency" } }, {}), undefined);
});

test("Hosted Payment Pages webhook amount and currency shapes are validated", () => {
  const details = { amount: { value: 2450, currencyCode: "GBP" } };
  assert.equal(resolveWorldpayAmount(details, {}), 2450);
  assert.equal(resolveWorldpayCurrency(details, {}), "GBP");
});

test("Worldpay Event-Signature verifies the untouched body and supports key rotation headers", () => {
  const payload = JSON.stringify({ eventId: "evt_123", eventDetails: { type: "authorized" } });
  const secret = "worldpay-test-secret";
  const signature = createHmac("sha256", secret).update(payload).digest("base64");
  const older = createHmac("sha256", "old-secret").update(payload).digest("base64");
  assert.equal(verifyWorldpayEventSignature(payload, `1/SHA256/${older}, 2/SHA256/${signature}`, secret), true);
  assert.equal(verifyWorldpayEventSignature(`${payload} `, `2/SHA256/${signature}`, secret), false);
  assert.equal(verifyWorldpayEventSignature(payload, "2/SHA1/not-supported", secret), false);
});

test("payment query outcomes only map explicit terminal Worldpay states", () => {
  assert.equal(resolveWorldpayQueryPaymentStatus("authorizationSucceeded"), "paid");
  assert.equal(resolveWorldpayQueryPaymentStatus("authorizationRefused"), "failed");
  assert.equal(resolveWorldpayQueryPaymentStatus("authorizationRequested"), undefined);
  assert.equal(resolveWorldpayQueryPaymentStatus("someFutureSucceededState"), undefined);
});
