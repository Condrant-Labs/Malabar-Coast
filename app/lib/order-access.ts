import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const ORDER_ACCESS_COOKIE = "malabar_order_access";
const ORDER_ACCESS_SECONDS = 30 * 24 * 60 * 60;
const MAX_GRANTED_ORDERS = 10;

// Version 1 granted a single order, so a second checkout silently revoked the first
// order page. Version 2 carries a bounded list and still verifies version 1 cookies.
type OrderAccessPayloadV1 = { version: 1; orderId: string; expiresAt: number };
type OrderAccessPayloadV2 = { version: 2; orderIds: string[]; expiresAt: number };
type OrderAccessPayload = OrderAccessPayloadV1 | OrderAccessPayloadV2;

function shouldUseSecureCookies() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost").protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function getOrderAccessSecret() {
  const configured = process.env.ORDER_ACCESS_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") return "development-only-order-access-secret-change-me";
  return null;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(encoded: string) {
  const secret = getOrderAccessSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`order-access.${encoded}`).digest("base64url");
}

export function isOrderAccessConfigured() {
  return Boolean(getOrderAccessSecret());
}

export function isProductionOrderAccessConfigured() {
  return Boolean(process.env.ORDER_ACCESS_SECRET?.trim() && process.env.ORDER_ACCESS_SECRET!.trim().length >= 32);
}

function verifiedOrderIds(token: string | undefined): string[] {
  if (!token) return [];
  const [encoded, signature] = token.split(".");
  const expected = encoded ? sign(encoded) : null;
  if (!encoded || !signature || !expected || !safeEqual(signature, expected)) return [];

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OrderAccessPayload;
    if (payload.expiresAt <= Math.floor(Date.now() / 1000)) return [];
    if (payload.version === 1) return typeof payload.orderId === "string" ? [payload.orderId] : [];
    if (payload.version === 2) return Array.isArray(payload.orderIds) ? payload.orderIds.filter((id) => typeof id === "string") : [];
    return [];
  } catch {
    return [];
  }
}

export async function setOrderAccess(response: NextResponse, orderId: string) {
  const cookieStore = await cookies();
  const granted = verifiedOrderIds(cookieStore.get(ORDER_ACCESS_COOKIE)?.value);
  const payload: OrderAccessPayloadV2 = {
    version: 2,
    orderIds: [orderId, ...granted.filter((id) => id !== orderId)].slice(0, MAX_GRANTED_ORDERS),
    expiresAt: Math.floor(Date.now() / 1000) + ORDER_ACCESS_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  if (!signature) throw new Error("Order access signing is not configured.");
  response.cookies.set(ORDER_ACCESS_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: ORDER_ACCESS_SECONDS,
    priority: "high",
  });
}

export async function hasOrderAccess(orderId: string) {
  const cookieStore = await cookies();
  return verifiedOrderIds(cookieStore.get(ORDER_ACCESS_COOKIE)?.value).includes(orderId);
}
