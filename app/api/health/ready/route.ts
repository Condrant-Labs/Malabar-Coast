import { timingSafeEqual } from "node:crypto";
import { checkAdminAuthSchema, getAdminSession } from "../../../lib/admin-auth";
import { checkDurableOrderStorage, isDurableOrderStorageConfigured } from "../../../lib/order-store";
import { isProductionOrderAccessConfigured } from "../../../lib/order-access";
import { isStripeProductionReady } from "../../../lib/payments/stripe";
import { checkBrevoConnection } from "../../../lib/email/brevo";
import { checkRateLimit, getClientAddress, noStoreJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The individual checks describe which secrets and providers are missing, which is a
// map of the weakest part of the deployment. Only an administrator session or the
// monitoring token may read them; everyone else sees ready or not ready.
async function mayReadDetail(request: Request) {
  const token = process.env.HEALTH_CHECK_TOKEN?.trim();
  const presented = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (token && token.length >= 24 && presented.length === token.length
    && timingSafeEqual(Buffer.from(presented), Buffer.from(token))) return true;
  return Boolean(await getAdminSession());
}

export async function GET(request: Request) {
  const rate = checkRateLimit("readiness", getClientAddress(request), 60, 60_000);
  if (!rate.allowed) {
    const response = noStoreJson({ status: "rate_limited" }, { status: 429 });
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  const storageConfigured = isDurableOrderStorageConfigured();
  const [storageReachable, adminAuthReachable, transactionalEmailReachable] = await Promise.all([
    storageConfigured ? checkDurableOrderStorage() : Promise.resolve(false),
    checkAdminAuthSchema(),
    checkBrevoConnection(),
  ]);
  const canonicalHttps = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").protocol === "https:"; } catch { return false; }
  })();
  const checks = {
    canonicalHttps,
    durableStorage: storageConfigured && storageReachable,
    orderAccessSigning: isProductionOrderAccessConfigured(),
    administratorAccess: adminAuthReachable,
    stripePayments: isStripeProductionReady(),
    transactionalEmail: transactionalEmailReachable,
  };
  const ready = Object.values(checks).every(Boolean);
  const body: Record<string, unknown> = { status: ready ? "ready" : "not_ready", time: new Date().toISOString() };
  if (await mayReadDetail(request)) body.checks = checks;
  return noStoreJson(body, { status: ready ? 200 : 503 });
}
