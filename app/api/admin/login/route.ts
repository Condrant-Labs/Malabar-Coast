import { NextResponse } from "next/server";
import { isAdminConfigured, setAdminSession, verifyAdminCredentials } from "../../../lib/admin-auth";
import { checkRateLimit, configuredSiteOrigin, getClientAddress, isTrustedOrigin, readLimitedFormData } from "../../../lib/security";

export const runtime = "nodejs";

function loginRedirect(request: Request, error?: string) {
  const url = new URL("/admin/login", configuredSiteOrigin(request));
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return loginRedirect(request, "request");
  if (!isAdminConfigured()) return loginRedirect(request, "configuration");

  // Per-address throttling alone does not bound a distributed guessing campaign, so the
  // single administrator account also carries its own ceiling across every source.
  const perAddress = checkRateLimit("admin-login", getClientAddress(request), 5, 15 * 60_000);
  const perAccount = checkRateLimit("admin-login-account", "administrator", 30, 15 * 60_000);
  if (!perAddress.allowed || !perAccount.allowed) {
    const response = loginRedirect(request, "rate-limit");
    response.headers.set("Retry-After", String(Math.max(perAddress.retryAfterSeconds, perAccount.retryAfterSeconds)));
    return response;
  }

  let form: URLSearchParams;
  try {
    form = await readLimitedFormData(request, 16_000);
  } catch {
    return loginRedirect(request, "request");
  }
  const username = String(form.get("username") || "").slice(0, 160);
  const password = String(form.get("password") || "").slice(0, 256);
  if (!verifyAdminCredentials(username, password)) return loginRedirect(request, "credentials");

  const response = NextResponse.redirect(new URL("/admin", configuredSiteOrigin(request)), 303);
  setAdminSession(response);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
