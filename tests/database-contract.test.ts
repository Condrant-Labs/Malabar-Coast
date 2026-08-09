import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("database schema contains the atomic checkout and transition boundary", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create unique index if not exists orders_idempotency_key_hash_uidx/i);
  assert.match(schema, /create or replace function public\.create_checkout_order/i);
  assert.match(schema, /on conflict \(idempotency_key_hash\).*do nothing/i);
  assert.match(schema, /create or replace function public\.transition_order_status/i);
  assert.match(schema, /for update/i);
  assert.match(schema, /create or replace function public\.order_database_health/i);
  assert.match(schema, /2026-08-09-hosted-payments-v2/i);
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

test("hosted checkout may attach its URL before Worldpay creates a payment ID", async () => {
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
  assert.match(schema, /create or replace function public\.update_order_admin_notes/i);
  assert.match(schema, /length\(p_admin_notes\) > 2000/i);
  assert.match(schema, /revoke all on function public\.update_order_admin_notes\(text, text\) from public/i);
  assert.match(schema, /grant execute on function public\.update_order_admin_notes\(text, text\) to service_role/i);
});

test("durable storage supports current Supabase secret keys without bearer misuse", async () => {
  const store = await readFile(new URL("../app/lib/order-store.ts", import.meta.url), "utf8");
  assert.match(store, /process\.env\.SUPABASE_SECRET_KEY \|\| process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(store, /!key\.startsWith\("sb_secret_"\).*Authorization/s);
  assert.match(store, /process\.env\.SUPABASE_URL \|\| process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
});
