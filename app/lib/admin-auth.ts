import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const ADMIN_COOKIE = "malabar_admin_session";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

type AdminSessionPayload = {
  version: 1;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
  // Bound to the configured credentials so rotating the administrator password or
  // username immediately invalidates every issued session cookie.
  credentialEpoch: string;
};

function shouldUseSecureCookies() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost").protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export type AdminSession = AdminSessionPayload & { csrfToken: string };

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

function sign(value: string, purpose: string) {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`${purpose}.${value}`).digest("base64url");
}

function createCsrfToken(nonce: string) {
  return sign(nonce, "admin-csrf") || "";
}

function credentialEpoch() {
  return createHash("sha256")
    .update(`${process.env.ADMIN_USERNAME?.trim().toLowerCase() || ""}\u0000${process.env.ADMIN_PASSWORD_HASH?.trim() || ""}`)
    .digest("base64url")
    .slice(0, 22);
}

function parseSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded, "admin-session");
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminSessionPayload;
    if (payload.version !== 1 || !payload.nonce || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!payload.credentialEpoch || !safeEqual(payload.credentialEpoch, credentialEpoch())) return null;
    return { ...payload, csrfToken: createCsrfToken(payload.nonce) };
  } catch {
    return null;
  }
}

// Layouts, newest first:
//   scrypt:N=<n>,r=<r>,p=<p>:<salt>:<hash>   current
//   scrypt$N=<n>,r=<r>,p=<p>$<salt>$<hash>   same, dollar separated
//   scrypt$<salt>$<hash>                     original, at the library default cost
//
// The separator is a colon because Next.js parses .env files through dotenv-expand,
// which treats `$name` as a variable reference. A dollar-separated hash in a .env file
// is silently rewritten to a shorter string and the administrator page then reports
// "setup required" with no other clue. Platform environment editors such as Vercel do
// not expand, so dollar separated values are still accepted from those.
const LEGACY_SCRYPT_COST = { N: 16_384, r: 8, p: 1 };
export const CURRENT_SCRYPT_COST = { N: 32_768, r: 8, p: 1 };

type ParsedPasswordHash = { salt: string; hash: Buffer; cost: { N: number; r: number; p: number } };

function parseCost(encoded: string) {
  const values = Object.fromEntries(encoded.split(",").map((pair) => pair.split("=")));
  const N = Number(values.N);
  const r = Number(values.r);
  const p = Number(values.p);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || N < 16_384 || r < 1 || p < 1) return null;
  return { N, r, p };
}

export function parseAdminPasswordHash(value: string): ParsedPasswordHash | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("scrypt")) return null;
  const separator = trimmed[6];
  if (separator !== ":" && separator !== "$") return null;

  const parts = trimmed.split(separator);
  let cost = LEGACY_SCRYPT_COST;
  let salt: string | undefined;
  let encodedHash: string | undefined;

  if (parts.length === 3) [, salt, encodedHash] = parts;
  else if (parts.length === 4) {
    const parsedCost = parseCost(parts[1]);
    if (!parsedCost) return null;
    cost = parsedCost;
    salt = parts[2];
    encodedHash = parts[3];
  } else return null;

  if (!salt || !encodedHash) return null;
  const hash = Buffer.from(encodedHash, "base64url");
  return hash.length >= 32 ? { salt, hash, cost } : null;
}

export function isAdminConfigured() {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  if (configuredHash && !parseAdminPasswordHash(configuredHash)) {
    console.error(
      "ADMIN_PASSWORD_HASH is set but unreadable. If it came from a .env file and contains '$',"
      + " dotenv expansion has rewritten it. Regenerate it with `pnpm admin:hash`.",
    );
  }
  return Boolean(process.env.ADMIN_USERNAME?.trim() && parseAdminPasswordHash(configuredHash) && getSessionSecret());
}

export function verifyAdminCredentials(username: string, password: string) {
  const parsed = parseAdminPasswordHash(process.env.ADMIN_PASSWORD_HASH?.trim() || "");
  const expectedUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "";
  const configured = Boolean(expectedUsername && parsed && getSessionSecret());
  const usernameMatches = configured && safeEqual(username.trim().toLowerCase(), expectedUsername);

  // The key derivation always runs, so a wrong username or an out-of-range password
  // costs the same as a wrong password and cannot be distinguished by response time.
  const cost = parsed?.cost ?? CURRENT_SCRYPT_COST;
  const keyLength = parsed?.hash.length ?? 64;
  let actualHash: Buffer;
  try {
    actualHash = scryptSync(password.slice(0, 256), parsed?.salt ?? "unconfigured", keyLength, {
      ...cost,
      maxmem: 256 * cost.N * cost.r,
    });
  } catch {
    return false;
  }

  const passwordMatches = Boolean(parsed) && timingSafeEqual(parsed!.hash, actualHash);
  return configured && usernameMatches && passwordMatches && password.length >= 12 && password.length <= 256;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function setAdminSession(response: NextResponse) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    version: 1,
    issuedAt: now,
    expiresAt: now + SESSION_LIFETIME_SECONDS,
    nonce: randomBytes(24).toString("base64url"),
    credentialEpoch: credentialEpoch(),
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
