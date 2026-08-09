import assert from "node:assert/strict";
import test from "node:test";
import { getClientAddress, isValidOrderId } from "../app/lib/security";

function requestWith(headers: Record<string, string>) {
  return new Request("https://malabarcoast.test/api/checkout", { headers });
}

test("a forged x-forwarded-for prefix cannot reset a rate-limit bucket", () => {
  // One trusted proxy appends the real address on the right. Anything the client sent
  // sits to its left and must be ignored, otherwise every request looks like a new client.
  assert.equal(getClientAddress(requestWith({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" })), "203.0.113.7");
  assert.equal(getClientAddress(requestWith({ "x-forwarded-for": "203.0.113.7" })), "203.0.113.7");
});

test("an edge platform address header wins over a client-supplied chain", () => {
  assert.equal(
    getClientAddress(requestWith({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "9.9.9.9" })),
    "203.0.113.7",
  );
});

test("a request with no address headers collapses to one shared bucket", () => {
  assert.equal(getClientAddress(requestWith({})), "unknown");
});

test("order identifiers are constrained to the generated shape", () => {
  assert.equal(isValidOrderId("ord_" + "a".repeat(24)), true);
  assert.equal(isValidOrderId("ord_short"), false);
  assert.equal(isValidOrderId("../../etc/passwd"), false);
  assert.equal(isValidOrderId("ord_abc?select=*"), false);
});
