import assert from "node:assert/strict";
import test from "node:test";
import { authenticateSupabaseAdmin, isAdminConfigured } from "../app/lib/admin-auth";
import { adminCan } from "../app/lib/admin-permissions";

function configureAdminAuth() {
  process.env.SUPABASE_URL = "https://restaurant.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_server";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_browser";
  process.env.ADMIN_SESSION_SECRET = "x".repeat(48);
}

function clearAdminAuth() {
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.ADMIN_SESSION_SECRET;
}

test("administrator configuration requires Supabase Auth, server access and session signing", () => {
  clearAdminAuth();
  assert.equal(isAdminConfigured(), false);
  configureAdminAuth();
  assert.equal(isAdminConfigured(), true);
  delete process.env.SUPABASE_SECRET_KEY;
  assert.equal(isAdminConfigured(), false);
});

test("role permissions follow least privilege", () => {
  assert.equal(adminCan("owner", "settings:read"), true);
  assert.equal(adminCan("admin", "orders:notes"), true);
  assert.equal(adminCan("manager", "reports:read"), true);
  assert.equal(adminCan("manager", "settings:read"), false);
  assert.equal(adminCan("kitchen", "orders:transition"), true);
  assert.equal(adminCan("kitchen", "orders:notes"), false);
  assert.equal(adminCan("viewer", "orders:read"), true);
  assert.equal(adminCan("viewer", "orders:transition"), false);
});

test("Supabase Auth login also requires an active matching administrator profile", async () => {
  configureAdminAuth();
  const originalFetch = globalThis.fetch;
  const requests: { url: string; authorization: string | null; apikey: string | null }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    requests.push({ url, authorization: headers.get("authorization"), apikey: headers.get("apikey") });
    if (url.includes("/auth/v1/token")) {
      return new Response(JSON.stringify({ user: { id: "11111111-1111-4111-8111-111111111111", email: "owner@example.com" } }), { status: 200 });
    }
    if (url.includes("/rest/v1/admin_profiles?")) {
      return new Response(JSON.stringify([{
        user_id: "11111111-1111-4111-8111-111111111111",
        email: "owner@example.com",
        display_name: "Restaurant Owner",
        role: "owner",
        is_active: true,
        session_version: 3,
      }]), { status: 200 });
    }
    if (url.includes("/rest/v1/rpc/record_admin_login")) return new Response(null, { status: 204 });
    return new Response("not found", { status: 404 });
  };

  try {
    const result = await authenticateSupabaseAdmin("OWNER@example.com", "a strong unique password");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.identity.role, "owner");
      assert.equal(result.identity.sessionVersion, 3);
    }
    assert.equal(requests[0].apikey, "sb_publishable_browser");
    assert.equal(requests[1].apikey, "sb_secret_server");
    assert.equal(requests[1].authorization, null, "a current secret API key must not be sent as a bearer JWT");
    assert.ok(requests.some((request) => request.url.includes("record_admin_login")));
  } finally {
    globalThis.fetch = originalFetch;
    clearAdminAuth();
  }
});

test("an authenticated but inactive Supabase user cannot enter operations", async () => {
  configureAdminAuth();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/auth/v1/token")) {
      return new Response(JSON.stringify({ user: { id: "22222222-2222-4222-8222-222222222222", email: "staff@example.com" } }), { status: 200 });
    }
    return new Response(JSON.stringify([{
      user_id: "22222222-2222-4222-8222-222222222222",
      email: "staff@example.com",
      display_name: "Staff",
      role: "viewer",
      is_active: false,
      session_version: 1,
    }]), { status: 200 });
  };

  try {
    assert.deepEqual(await authenticateSupabaseAdmin("staff@example.com", "a strong unique password"), { ok: false, reason: "authorization" });
  } finally {
    globalThis.fetch = originalFetch;
    clearAdminAuth();
  }
});
