import { NextResponse, type NextRequest } from "next/server";

const privatePathPrefixes = ["/admin", "/order", "/checkout", "/api"];

function supabaseConnectSources() {
  const configured = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) return "";

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    const websocketProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    return ` ${url.origin} ${websocketProtocol}//${url.host}`;
  } catch {
    return "";
  }
}

// The Content Security Policy is issued here rather than in next.config.ts so every
// document carries a fresh nonce. Next.js reads the policy from the request header
// below and stamps the same nonce onto its own inline bootstrap scripts, which lets
// nonce-aware browsers ignore the legacy 'unsafe-inline' fallback and close the
// reflected-script gap while older clients still receive a usable application.
export default function proxy(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const canonicalSiteUsesHttps = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const contentSecurityPolicy = [
    "default-src 'self'",
    // 'strict-dynamic' lets a nonce-approved bootstrap load application chunks.
    // 'unsafe-inline' stays only as the ignored fallback for browsers
    // without CSP level 3 support; nonce-aware browsers discard it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google.com https://maps.gstatic.com https://*.googleusercontent.com",
    "font-src 'self' data:",
    `connect-src 'self'${supabaseConnectSources()}`,
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(!isDevelopment && canonicalSiteUsesHttps ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  // Next.js replaces the no-store header configured in next.config.ts with
  // `no-cache, must-revalidate` when it renders a dynamic page. That still allows the
  // response to be written to disk, so the pages carrying customer contact details,
  // addresses and baskets set it again here, after the framework.
  if (privatePathPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|woff|woff2)$).*)",
  ],
};
