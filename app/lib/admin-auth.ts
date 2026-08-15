import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { adminCan, isAdminRole, type AdminPermission, type AdminRole } from "./admin-permissions";
import {
  isSupabaseAuthConfigured,
  supabasePasswordSignIn,
  supabaseServerRequest,
  supabaseServerRpc,
} from "./supabase/server";

const ADMIN_COOKIE = "malabar_admin_session";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

type AdminProfileRow = {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  session_version: number;
};

export type AdminIdentity = {
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
  sessionVersion: number;
};

type AdminSessionPayload = {
  version: 2;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
  userId: string;
  role: AdminRole;
  sessionVersion: number;
};

export type AdminSession = AdminIdentity & AdminSessionPayload & { csrfToken: string };

export type AdminSignInResult =
  | { ok: true; identity: AdminIdentity }
  | { ok: false; reason: "credentials" | "authorization" | "unavailable" };

function shouldUseSecureCookies() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost").protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function sign(value: string, purpose: string) {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`${purpose}.${value}`).digest("base64url");
}

function createCsrfToken(nonce: string) {
  return sign(nonce, "admin-csrf") || "";
}

function profileIdentity(row: AdminProfileRow | undefined): AdminIdentity | null {
  if (!row || !row.is_active || !isAdminRole(row.role) || !Number.isInteger(row.session_version) || row.session_version < 1) return null;
  if (!/^[0-9a-f-]{36}$/i.test(row.user_id) || !row.email || !row.display_name) return null;
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    sessionVersion: row.session_version,
  };
}

async function getAdminProfile(userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: "user_id,email,display_name,role,is_active,session_version",
    limit: "1",
  });
  const response = await supabaseServerRequest(`admin_profiles?${query}`, { method: "GET" });
  const rows = await response.json() as AdminProfileRow[];
  return profileIdentity(rows[0]);
}

function parseSession(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded, "admin-session");
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminSessionPayload;
    if (payload.version !== 2 || !payload.nonce || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!isAdminRole(payload.role) || !Number.isInteger(payload.sessionVersion) || payload.sessionVersion < 1) return null;
    if (!/^[0-9a-f-]{36}$/i.test(payload.userId)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAdminConfigured() {
  return Boolean(isSupabaseAuthConfigured() && getSessionSecret());
}

export async function authenticateSupabaseAdmin(email: string, password: string): Promise<AdminSignInResult> {
  if (!isAdminConfigured()) return { ok: false, reason: "unavailable" };
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !normalizedEmail.includes("@") || password.length < 8 || password.length > 256) {
    return { ok: false, reason: "credentials" };
  }

  let response: Response;
  try {
    response = await supabasePasswordSignIn(normalizedEmail, password);
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (!response.ok) return { ok: false, reason: response.status >= 500 ? "unavailable" : "credentials" };
  const result = await response.json() as { user?: { id?: string; email?: string } };
  const userId = result.user?.id || "";
  if (!userId || result.user?.email?.toLowerCase() !== normalizedEmail) return { ok: false, reason: "credentials" };

  try {
    const identity = await getAdminProfile(userId);
    if (!identity || identity.email.toLowerCase() !== normalizedEmail) return { ok: false, reason: "authorization" };
    await supabaseServerRpc("record_admin_login", { p_actor_user_id: identity.userId });
    return { ok: true, identity };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function getAdminSession(requiredPermission?: AdminPermission) {
  if (!isAdminConfigured()) return null;
  const cookieStore = await cookies();
  const payload = parseSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!payload) return null;

  try {
    const identity = await getAdminProfile(payload.userId);
    if (!identity || identity.role !== payload.role || identity.sessionVersion !== payload.sessionVersion) return null;
    if (requiredPermission && !adminCan(identity.role, requiredPermission)) return null;
    return { ...payload, ...identity, csrfToken: createCsrfToken(payload.nonce) } satisfies AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(response: NextResponse, identity: AdminIdentity) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    version: 2,
    issuedAt: now,
    expiresAt: now + SESSION_LIFETIME_SECONDS,
    nonce: randomBytes(24).toString("base64url"),
    userId: identity.userId,
    role: identity.role,
    sessionVersion: identity.sessionVersion,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded, "admin-session");
  if (!signature) throw new Error("Admin authentication is not configured.");

  response.cookies.set(ADMIN_COOKIE, `${encoded}.${signature}`, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
    priority: "high",
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function verifyAdminCsrf(session: AdminSession, candidate: string) {
  return Boolean(candidate && safeEqual(candidate, session.csrfToken));
}

export async function recordAdminLogout(session: AdminSession) {
  try {
    await supabaseServerRpc("record_admin_logout", { p_actor_user_id: session.userId });
  } catch {
    // Clearing the local session must still succeed if audit storage is temporarily
    // unavailable. A failed database request is already visible in readiness checks.
  }
}

export async function checkAdminAuthSchema() {
  if (!isAdminConfigured()) return false;
  try {
    const health = await supabaseServerRpc<{ version?: string; adminProfilesTable?: boolean; adminAuditLogTable?: boolean }>("admin_auth_health", {});
    return health.version === "2026-08-15-supabase-admin-auth-v1"
      && health.adminProfilesTable === true
      && health.adminAuditLogTable === true;
  } catch {
    return false;
  }
}
