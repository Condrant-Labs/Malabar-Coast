import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import test from "node:test";
import { CURRENT_SCRYPT_COST, isAdminConfigured, parseAdminPasswordHash, verifyAdminCredentials } from "../app/lib/admin-auth";

function makeHash(password: string, separator = ":", cost = CURRENT_SCRYPT_COST) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64, { ...cost, maxmem: 256 * cost.N * cost.r }).toString("base64url");
  return ["scrypt", `N=${cost.N},r=${cost.r},p=${cost.p}`, salt, hash].join(separator);
}

function makeLegacyHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("base64url")}`;
}

test("the current and legacy password hash layouts are all readable", () => {
  assert.ok(parseAdminPasswordHash(makeHash("a sufficiently long password")));
  assert.ok(parseAdminPasswordHash(makeHash("a sufficiently long password", "$")));
  assert.ok(parseAdminPasswordHash(makeLegacyHash("a sufficiently long password")));
  assert.equal(parseAdminPasswordHash("plaintext"), null);
  assert.equal(parseAdminPasswordHash("scrypt:onlyone"), null);
  assert.equal(parseAdminPasswordHash("scrypt:N=1024,r=8,p=1:salt:aGFzaA"), null, "a weakened cost is rejected");
});

// Next.js parses .env files through dotenv-expand, which rewrites `$name` as a variable
// reference. A dollar-separated hash in .env silently becomes a different, shorter
// string and the administrator page then reports "setup required" with no other clue.
test("the generated hash contains no character that dotenv would expand", () => {
  const generated = makeHash("a sufficiently long password");
  assert.ok(!generated.includes("$"), "a generated hash must be safe to paste into a .env file");
  assert.equal(generated.split(":").length, 4);
});

test("administrator credentials are verified against the configured hash", () => {
  const password = "a sufficiently long password";
  process.env.ADMIN_USERNAME = "Kitchen";
  process.env.ADMIN_PASSWORD_HASH = makeHash(password);
  process.env.ADMIN_SESSION_SECRET = "x".repeat(48);

  assert.equal(isAdminConfigured(), true);
  assert.equal(verifyAdminCredentials("kitchen", password), true, "the username comparison is case insensitive");
  assert.equal(verifyAdminCredentials("kitchen", `${password}!`), false);
  assert.equal(verifyAdminCredentials("someone-else", password), false);
  assert.equal(verifyAdminCredentials("kitchen", "short"), false);
});

test("a legacy hash still authenticates so a deployment is not locked out", () => {
  const password = "a sufficiently long password";
  process.env.ADMIN_USERNAME = "kitchen";
  process.env.ADMIN_PASSWORD_HASH = makeLegacyHash(password);
  process.env.ADMIN_SESSION_SECRET = "x".repeat(48);

  assert.equal(verifyAdminCredentials("kitchen", password), true);
  assert.equal(verifyAdminCredentials("kitchen", "another long password"), false);
});

test("an unconfigured administrator never authenticates", () => {
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD_HASH;
  delete process.env.ADMIN_SESSION_SECRET;

  assert.equal(isAdminConfigured(), false);
  assert.equal(verifyAdminCredentials("", ""), false);
  assert.equal(verifyAdminCredentials("kitchen", "a sufficiently long password"), false);
});
