import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("database schema contains the atomic checkout and transition boundary", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create unique index if not exists orders_idempotency_key_hash_uidx/i);
  assert.match(schema, /create or replace function public\.create_checkout_order/i);
  assert.match(schema, /on conflict \(idempotency_key_hash\).*do nothing/i);
  assert.match(schema, /create function public\.transition_order_status/i);
  assert.match(schema, /for update/i);
  assert.match(schema, /create or replace function public\.order_database_health/i);
  assert.match(schema, /2026-08-22-bookings-v4/i);
  assert.match(schema, /grant execute on function public\.order_database_health\(\) to service_role/i);
});

test("payment event RPC requires provider identity and value inputs", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /p_provider_reference text default null/i);
  assert.match(schema, /p_amount_pence integer default null/i);
  assert.match(schema, /p_currency text default null/i);
  assert.match(schema, /payment_reversed/i);
  assert.match(schema, /payment_disputed/i);
  assert.match(schema, /p_payment_status in \('paid', 'partially_refunded', 'refunded', 'disputed', 'reversed'\)/i);
  assert.doesNotMatch(schema, /if p_provider = 'stripe'\s+and p_payment_status in/i);
});

test("hosted checkout supports a provider redirect and reference", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /p_provider_reference text default null/i);
  assert.match(schema, /p_provider_reference is null and p_provider_checkout_url is null/i);
  assert.match(schema, /providerCheckoutUrl/i);
});

test("order tables constrain their state columns and stay private", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /constraint orders_status_check/i);
  assert.match(schema, /constraint orders_provider_check/i);
  assert.match(schema, /constraint order_payment_events_status_check/i);
  assert.match(schema, /revoke all on table public\.orders from anon, authenticated/i);
  assert.match(schema, /revoke all on table public\.order_payment_events from anon, authenticated/i);
  assert.match(schema, /create index if not exists orders_created_at_idx/i);
});

test("a retention routine exists for stored customer personal data", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create or replace function public\.redact_old_order_personal_data/i);
  assert.match(schema, /Refusing to redact orders newer than 30 days/i);
  assert.match(schema, /grant execute on function public\.redact_old_order_personal_data\(integer\) to service_role/i);
});

test("administrator notes can update without granting broader order writes", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create function public\.update_order_admin_notes/i);
  assert.match(schema, /length\(p_admin_notes\) > 2000/i);
  assert.match(schema, /revoke all on function public\.update_order_admin_notes\(text, text, uuid\) from public/i);
  assert.match(schema, /grant execute on function public\.update_order_admin_notes\(text, text, uuid\) to service_role/i);
  assert.match(schema, /actor_role not in \('owner', 'admin', 'manager'\)/i);
});

test("durable storage supports current Supabase secret keys without bearer misuse", async () => {
  const server = await readFile(new URL("../app/lib/supabase/server.ts", import.meta.url), "utf8");
  assert.match(server, /process\.env\.SUPABASE_SECRET_KEY \|\| process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(server, /!key\.startsWith\("sb_secret_"\)[\s\S]*Authorization/);
  assert.match(server, /process\.env\.SUPABASE_URL \|\| process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
});

test("Supabase Auth profiles are deny-by-default, role constrained and private", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create table if not exists public\.admin_profiles/i);
  assert.match(schema, /references auth\.users\(id\) on delete cascade/i);
  assert.match(schema, /role text not null default 'viewer'/i);
  assert.match(schema, /is_active boolean not null default false/i);
  assert.match(schema, /session_version integer not null default 1/i);
  assert.match(schema, /alter table public\.admin_profiles enable row level security/i);
  assert.match(schema, /revoke all on table public\.admin_profiles from anon, authenticated/i);
  assert.match(schema, /create trigger create_admin_profile_after_auth_user/i);
});

test("administrator actions are role checked and written to a private audit log", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create table if not exists public\.admin_audit_log/i);
  assert.match(schema, /revoke all on table public\.admin_audit_log from anon, authenticated/i);
  assert.match(schema, /actor_role not in \('owner', 'admin', 'manager', 'kitchen'\)/i);
  assert.match(schema, /'order\.status\.transition'/i);
  assert.match(schema, /'order\.notes\.update'/i);
  assert.match(schema, /create or replace function public\.record_admin_login/i);
  assert.match(schema, /create or replace function public\.record_admin_logout/i);
});
