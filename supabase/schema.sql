create table if not exists public.orders (
  id text primary key,
  status text not null,
  provider text not null,
  idempotency_key_hash text,
  request_fingerprint text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists idempotency_key_hash text;
alter table public.orders add column if not exists request_fingerprint text;

update public.orders
set
  idempotency_key_hash = coalesce(idempotency_key_hash, data->>'idempotencyKeyHash'),
  request_fingerprint = coalesce(request_fingerprint, data->>'requestFingerprint')
where idempotency_key_hash is null or request_fingerprint is null;

create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
-- Support lookups by customer contact, without exposing a separate PII column.
create index if not exists orders_customer_email_idx on public.orders ((lower(data->'customer'->>'email')));
create unique index if not exists orders_idempotency_key_hash_uidx
  on public.orders (idempotency_key_hash)
  where idempotency_key_hash is not null;

do $$ begin
  alter table public.orders add constraint orders_status_check check (status in (
    'pending_payment', 'paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed',
    'payment_failed', 'cancelled', 'expired', 'payment_partially_refunded', 'refunded',
    'payment_disputed', 'payment_reversed'
  )) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_provider_check
    check (provider in ('stripe', 'worldpay')) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_id_shape_check
    check (id ~ '^ord_[A-Za-z0-9_-]{20,60}$') not valid;
exception when duplicate_object then null; end $$;

alter table public.orders enable row level security;

revoke all on table public.orders from anon, authenticated;

create table if not exists public.order_payment_events (
  provider text not null,
  event_id text not null,
  order_id text not null references public.orders(id) on delete cascade,
  payment_status text not null,
  outcome text not null,
  provider_reference text,
  amount_pence integer,
  currency text,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

alter table public.order_payment_events add column if not exists provider_reference text;
alter table public.order_payment_events add column if not exists amount_pence integer;
alter table public.order_payment_events add column if not exists currency text;

create index if not exists order_payment_events_order_id_idx
  on public.order_payment_events (order_id, created_at desc);

do $$ begin
  alter table public.order_payment_events add constraint order_payment_events_provider_check
    check (provider in ('stripe', 'worldpay')) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.order_payment_events add constraint order_payment_events_status_check
    check (payment_status in (
      'pending', 'paid', 'failed', 'cancelled', 'expired',
      'partially_refunded', 'refunded', 'disputed', 'reversed'
    )) not valid;
exception when duplicate_object then null; end $$;

alter table public.order_payment_events enable row level security;
revoke all on table public.order_payment_events from anon, authenticated;

-- Supabase Auth owns credentials and identity. This profile table owns only the
-- application authorization decision. New Auth users start inactive and cannot
-- enter the operations portal until an owner explicitly assigns and activates a role.
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'viewer',
  is_active boolean not null default false,
  session_version integer not null default 1,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.admin_profiles add column if not exists email text;
alter table public.admin_profiles add column if not exists display_name text;
alter table public.admin_profiles add column if not exists role text not null default 'viewer';
alter table public.admin_profiles add column if not exists is_active boolean not null default false;
alter table public.admin_profiles add column if not exists session_version integer not null default 1;
alter table public.admin_profiles add column if not exists last_login_at timestamptz;
alter table public.admin_profiles add column if not exists created_at timestamptz not null default now();
alter table public.admin_profiles add column if not exists updated_at timestamptz not null default now();
alter table public.admin_profiles add column if not exists created_by uuid references auth.users(id) on delete set null;

create unique index if not exists admin_profiles_email_uidx on public.admin_profiles ((lower(email)));
create index if not exists admin_profiles_active_role_idx on public.admin_profiles (is_active, role);

do $$ begin
  alter table public.admin_profiles add constraint admin_profiles_role_check
    check (role in ('owner', 'admin', 'manager', 'kitchen', 'viewer'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.admin_profiles add constraint admin_profiles_session_version_check
    check (session_version >= 1);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.admin_profiles add constraint admin_profiles_display_name_check
    check (char_length(display_name) between 1 and 100);
exception when duplicate_object then null; end $$;

alter table public.admin_profiles enable row level security;
revoke all on table public.admin_profiles from anon, authenticated;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  actor_role text not null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_created_idx on public.admin_audit_log (actor_user_id, created_at desc);
create index if not exists admin_audit_log_target_created_idx on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_audit_log_action_created_idx on public.admin_audit_log (action, created_at desc);

do $$ begin
  alter table public.admin_audit_log add constraint admin_audit_log_actor_role_check
    check (actor_role in ('owner', 'admin', 'manager', 'kitchen', 'viewer'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.admin_audit_log add constraint admin_audit_log_action_check
    check (action ~ '^[a-z][a-z0-9_.-]{2,79}$');
exception when duplicate_object then null; end $$;

alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from anon, authenticated;

create table if not exists public.app_schema_versions (
  version text primary key,
  description text not null,
  applied_at timestamptz not null default now()
);

alter table public.app_schema_versions enable row level security;
revoke all on table public.app_schema_versions from anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public;
drop trigger if exists admin_profiles_touch_updated_at on public.admin_profiles;
create trigger admin_profiles_touch_updated_at
before update on public.admin_profiles
for each row execute function public.touch_updated_at();

create or replace function public.create_admin_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or btrim(new.email) = '' then
    return new;
  end if;

  insert into public.admin_profiles (user_id, email, display_name, role, is_active)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    left(coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(coalesce(new.email, 'Staff'), '@', 1)), 100),
    'viewer',
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_admin_profile_for_auth_user() from public;
drop trigger if exists create_admin_profile_after_auth_user on auth.users;
create trigger create_admin_profile_after_auth_user
after insert on auth.users
for each row execute function public.create_admin_profile_for_auth_user();

-- Backfill existing Auth users as inactive viewers. Activation is always explicit.
insert into public.admin_profiles (user_id, email, display_name, role, is_active)
select
  id,
  lower(coalesce(email, '')),
  left(coalesce(nullif(raw_user_meta_data->>'display_name', ''), split_part(coalesce(email, 'Staff'), '@', 1)), 100),
  'viewer',
  false
from auth.users
where email is not null
on conflict (user_id) do nothing;

create or replace function public.record_admin_login(p_actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text;
  actor_role text;
begin
  select email, role into actor_email, actor_role
  from public.admin_profiles
  where user_id = p_actor_user_id and is_active = true
  for update;

  if not found then raise exception 'Administrator is not active'; end if;

  update public.admin_profiles set last_login_at = now() where user_id = p_actor_user_id;
  insert into public.admin_audit_log (actor_user_id, actor_email, actor_role, action, target_type, target_id)
  values (p_actor_user_id, actor_email, actor_role, 'auth.login', 'admin_profile', p_actor_user_id::text);
end;
$$;

revoke all on function public.record_admin_login(uuid) from public;
grant execute on function public.record_admin_login(uuid) to service_role;

create or replace function public.record_admin_logout(p_actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text;
  actor_role text;
begin
  select email, role into actor_email, actor_role
  from public.admin_profiles
  where user_id = p_actor_user_id;

  if not found then return; end if;
  insert into public.admin_audit_log (actor_user_id, actor_email, actor_role, action, target_type, target_id)
  values (p_actor_user_id, actor_email, actor_role, 'auth.logout', 'admin_profile', p_actor_user_id::text);
end;
$$;

revoke all on function public.record_admin_logout(uuid) from public;
grant execute on function public.record_admin_logout(uuid) to service_role;

create or replace function public.create_checkout_order(
  p_id text,
  p_provider text,
  p_idempotency_key_hash text,
  p_request_fingerprint text,
  p_data jsonb,
  p_created_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_data jsonb;
  existing_data jsonb;
  existing_fingerprint text;
begin
  if p_id is null or p_id !~ '^ord_[A-Za-z0-9_-]{20,60}$'
    or p_provider is null or p_provider not in ('stripe', 'worldpay')
    or p_idempotency_key_hash is null or p_idempotency_key_hash !~ '^[a-f0-9]{64}$'
    or p_request_fingerprint is null or p_request_fingerprint !~ '^[a-f0-9]{64}$'
    or p_data->>'id' is distinct from p_id
    or p_data->>'provider' is distinct from p_provider
    or p_data->>'status' is distinct from 'pending_payment'
    or p_data->>'paymentStatus' is distinct from 'pending' then
    raise exception 'Invalid checkout order';
  end if;

  insert into public.orders (
    id, status, provider, idempotency_key_hash, request_fingerprint, data, created_at, updated_at
  ) values (
    p_id, 'pending_payment', p_provider, p_idempotency_key_hash, p_request_fingerprint,
    p_data, p_created_at, p_created_at
  )
  on conflict (idempotency_key_hash) where idempotency_key_hash is not null do nothing
  returning data into inserted_data;

  if inserted_data is not null then
    return jsonb_build_object('result', 'created', 'order', inserted_data);
  end if;

  select data, request_fingerprint into existing_data, existing_fingerprint
  from public.orders
  where idempotency_key_hash = p_idempotency_key_hash
  for update;

  if existing_data is null then
    raise exception 'Checkout idempotency claim could not be resolved';
  end if;

  return jsonb_build_object(
    'result', case when existing_fingerprint = p_request_fingerprint then 'existing' else 'conflict' end,
    'order', existing_data
  );
end;
$$;

revoke all on function public.create_checkout_order(text, text, text, text, jsonb, timestamptz) from public;
grant execute on function public.create_checkout_order(text, text, text, text, jsonb, timestamptz) to service_role;

create or replace function public.attach_checkout_provider_reference(
  p_order_id text,
  p_provider text,
  p_provider_reference text default null,
  p_provider_checkout_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_data jsonb;
  changed_at timestamptz := now();
  changed_at_iso text := to_char(changed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if (p_provider_reference is null and p_provider_checkout_url is null)
    or (p_provider_reference is not null and (length(p_provider_reference) < 3 or length(p_provider_reference) > 180))
    or (p_provider_checkout_url is not null and (length(p_provider_checkout_url) > 2048 or p_provider_checkout_url !~ '^https://')) then
    raise exception 'Invalid provider checkout identity';
  end if;

  select data into current_data
  from public.orders
  where id = p_order_id and provider = p_provider
  for update;

  if not found or (
    current_data->>'providerReference' is not null
    and p_provider_reference is not null
    and current_data->>'providerReference' <> p_provider_reference
  ) or (
    current_data->>'providerCheckoutUrl' is not null
    and p_provider_checkout_url is not null
    and current_data->>'providerCheckoutUrl' <> p_provider_checkout_url
  ) then
    return null;
  end if;

  update public.orders
  set
    updated_at = changed_at,
    data = data || jsonb_strip_nulls(jsonb_build_object(
      'providerReference', p_provider_reference,
      'providerCheckoutUrl', coalesce(p_provider_checkout_url, data->>'providerCheckoutUrl'),
      'updatedAt', changed_at_iso
    ))
  where id = p_order_id and provider = p_provider
  returning data into current_data;

  return current_data;
end;
$$;

revoke all on function public.attach_checkout_provider_reference(text, text, text, text) from public;
grant execute on function public.attach_checkout_provider_reference(text, text, text, text) to service_role;

-- Validates administrator role and advances fulfilment while holding the same order
-- row lock used by payment events, so an admin action can never overwrite a refund
-- or reversal. The audit insert is part of the same transaction as the order update.
drop function if exists public.transition_order_status(text, text);
drop function if exists public.transition_order_status(text, text, uuid);
create function public.transition_order_status(p_order_id text, p_next_status text, p_actor_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text;
  actor_role text;
  current_data jsonb;
  current_status text;
  current_payment text;
  fulfilment_method text;
  changed_at timestamptz := now();
  changed_at_iso text := to_char(changed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  recent_history jsonb;
begin
  select email, role into actor_email, actor_role
  from public.admin_profiles
  where user_id = p_actor_user_id and is_active = true
  for share;

  if not found or actor_role not in ('owner', 'admin', 'manager', 'kitchen') then
    return null;
  end if;

  select status, data into current_status, current_data
  from public.orders
  where id = p_order_id
  for update;

  if not found then return null; end if;

  current_payment := coalesce(current_data->>'paymentStatus', case
    when current_status in ('paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed') then 'paid'
    else 'pending'
  end);
  fulfilment_method := current_data->>'fulfilment';

  if current_payment <> 'paid' or not (
    (current_status = 'paid' and p_next_status = 'confirmed')
    or (current_status = 'confirmed' and p_next_status = 'preparing')
    or (current_status = 'preparing' and p_next_status = 'ready')
    or (current_status = 'ready' and fulfilment_method = 'delivery' and p_next_status = 'out_for_delivery')
    or (current_status = 'ready' and p_next_status = 'completed')
    or (current_status = 'out_for_delivery' and fulfilment_method = 'delivery' and p_next_status = 'completed')
  ) then
    return null;
  end if;

  select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb)
  into recent_history
  from (
    select value, ordinality
    from jsonb_array_elements(coalesce(current_data->'statusHistory', '[]'::jsonb)) with ordinality
    order by ordinality desc
    limit 99
  ) recent;

  update public.orders
  set
    status = p_next_status,
    updated_at = changed_at,
    data = data || jsonb_build_object(
      'status', p_next_status,
      'updatedAt', changed_at_iso,
      'statusHistory', recent_history || jsonb_build_array(jsonb_build_object(
        'status', p_next_status, 'at', changed_at_iso, 'actor', 'admin', 'actorUserId', p_actor_user_id
      ))
    )
  where id = p_order_id
  returning data into current_data;

  insert into public.admin_audit_log (
    actor_user_id, actor_email, actor_role, action, target_type, target_id, metadata
  ) values (
    p_actor_user_id, actor_email, actor_role, 'order.status.transition', 'order', p_order_id,
    jsonb_build_object('from', current_status, 'to', p_next_status)
  );

  return current_data;
end;
$$;

revoke all on function public.transition_order_status(text, text, uuid) from public;
grant execute on function public.transition_order_status(text, text, uuid) to service_role;

drop function if exists public.update_order_admin_notes(text, text);
drop function if exists public.update_order_admin_notes(text, text, uuid);
create function public.update_order_admin_notes(p_order_id text, p_admin_notes text, p_actor_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text;
  actor_role text;
  current_data jsonb;
  changed_at timestamptz := now();
  changed_at_iso text := to_char(changed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  select email, role into actor_email, actor_role
  from public.admin_profiles
  where user_id = p_actor_user_id and is_active = true
  for share;

  if not found or actor_role not in ('owner', 'admin', 'manager') then
    return null;
  end if;

  if p_admin_notes is null or length(p_admin_notes) > 2000 then
    raise exception 'Invalid administrator notes';
  end if;

  update public.orders
  set
    updated_at = changed_at,
    data = data || jsonb_build_object(
      'adminNotes', p_admin_notes,
      'updatedAt', changed_at_iso
    )
  where id = p_order_id
  returning data into current_data;

  if current_data is not null then
    insert into public.admin_audit_log (
      actor_user_id, actor_email, actor_role, action, target_type, target_id, metadata
    ) values (
      p_actor_user_id, actor_email, actor_role, 'order.notes.update', 'order', p_order_id,
      jsonb_build_object('length', char_length(p_admin_notes))
    );
  end if;

  return current_data;
end;
$$;

revoke all on function public.update_order_admin_notes(text, text, uuid) from public;
grant execute on function public.update_order_admin_notes(text, text, uuid) to service_role;

drop function if exists public.apply_order_payment_event(text, text, text, text, text, text);

create or replace function public.apply_order_payment_event(
  p_provider text,
  p_event_id text,
  p_order_id text,
  p_payment_status text,
  p_outcome text,
  p_provider_reference text default null,
  p_amount_pence integer default null,
  p_currency text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  current_payment text;
  effective_payment text;
  next_status text;
  current_data jsonb;
  stored_reference text;
  stored_amount integer;
  stored_currency text;
  changed_at timestamptz := now();
  changed_at_iso text := to_char(changed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  recent_event_ids jsonb;
  next_history jsonb;
begin
  if p_provider is null or p_provider not in ('stripe', 'worldpay')
    or p_payment_status is null or p_payment_status not in ('pending', 'paid', 'failed', 'cancelled', 'expired', 'partially_refunded', 'refunded', 'disputed', 'reversed')
    or p_event_id is null or length(p_event_id) < 3 or length(p_event_id) > 180
    or p_order_id is null or length(p_order_id) < 16 or length(p_order_id) > 80
    or p_outcome is null then
    raise exception 'Invalid payment event';
  end if;

  select status, data into current_status, current_data
  from public.orders
  where id = p_order_id and provider = p_provider
  for update;

  if not found then return false; end if;

  stored_reference := current_data->>'providerReference';
  stored_amount := (current_data->>'totalPence')::integer;
  stored_currency := upper(current_data->>'currency');

  if (stored_reference is not null and p_provider_reference is not null and stored_reference <> p_provider_reference)
    or (p_amount_pence is not null and p_amount_pence <> stored_amount)
    or (p_currency is not null and upper(p_currency) <> stored_currency) then
    return false;
  end if;

  if p_payment_status in ('paid', 'partially_refunded', 'refunded', 'disputed', 'reversed')
    and (p_provider_reference is null or p_amount_pence is null or p_currency is null) then
    return false;
  end if;

  insert into public.order_payment_events (
    provider, event_id, order_id, payment_status, outcome, provider_reference, amount_pence, currency
  ) values (
    p_provider, p_event_id, p_order_id, p_payment_status, left(p_outcome, 180),
    p_provider_reference, p_amount_pence, upper(p_currency)
  )
  on conflict (provider, event_id) do nothing;

  if not found then return false; end if;

  current_payment := coalesce(current_data->>'paymentStatus', case
    when current_status in ('paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed') then 'paid'
    when current_status = 'payment_failed' then 'failed'
    when current_status = 'cancelled' then 'cancelled'
    when current_status = 'expired' then 'expired'
    when current_status = 'payment_partially_refunded' then 'partially_refunded'
    when current_status = 'refunded' then 'refunded'
    when current_status = 'payment_disputed' then 'disputed'
    when current_status = 'payment_reversed' then 'reversed'
    else 'pending'
  end);
  effective_payment := p_payment_status;
  next_status := current_status;

  if current_payment = 'refunded' then
    effective_payment := current_payment;
  elsif current_payment in ('partially_refunded', 'disputed', 'reversed') and p_payment_status = 'paid' then
    effective_payment := current_payment;
  elsif p_payment_status = 'refunded' then
    next_status := 'refunded';
  elsif p_payment_status = 'disputed' then
    next_status := 'payment_disputed';
  elsif p_payment_status = 'reversed' then
    next_status := 'payment_reversed';
  elsif p_payment_status = 'partially_refunded' then
    next_status := 'payment_partially_refunded';
  elsif p_payment_status in ('failed', 'cancelled', 'expired') and current_payment = 'paid' then
    effective_payment := 'reversed';
    next_status := 'payment_reversed';
  elsif p_payment_status = 'paid' and current_status in ('pending_payment', 'payment_failed', 'cancelled', 'expired') then
    next_status := 'paid';
  elsif p_payment_status = 'failed' and current_status = 'pending_payment' then
    next_status := 'payment_failed';
  elsif p_payment_status = 'cancelled' and current_status in ('pending_payment', 'payment_failed') then
    next_status := 'cancelled';
  elsif p_payment_status = 'expired' and current_status in ('pending_payment', 'payment_failed') then
    next_status := 'expired';
  elsif p_payment_status = 'pending' and current_payment <> 'pending' then
    effective_payment := current_payment;
  end if;

  select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb)
  into recent_event_ids
  from (
    select value, ordinality
    from jsonb_array_elements(coalesce(current_data->'processedWebhookIds', '[]'::jsonb)) with ordinality
    order by ordinality desc
    limit 49
  ) recent;

  next_history := coalesce(current_data->'statusHistory', '[]'::jsonb);
  if next_status <> current_status then
    next_history := next_history || jsonb_build_array(jsonb_build_object(
      'status', next_status, 'at', changed_at_iso, 'actor', 'payment_provider'
    ));
  end if;

  update public.orders
  set
    status = next_status,
    updated_at = changed_at,
    data = data || jsonb_build_object(
      'status', next_status,
      'paymentStatus', effective_payment,
      'providerOutcome', left(p_outcome, 180),
      'providerReference', coalesce(p_provider_reference, stored_reference),
      'processedWebhookIds', recent_event_ids || jsonb_build_array(p_event_id),
      'statusHistory', next_history,
      'updatedAt', changed_at_iso
    )
  where id = p_order_id and provider = p_provider;

  return true;
end;
$$;

revoke all on function public.apply_order_payment_event(text, text, text, text, text, text, integer, text) from public;
grant execute on function public.apply_order_payment_event(text, text, text, text, text, text, integer, text) to service_role;

-- Retention. Customer name, email, phone and delivery address are stored inside `data`
-- and would otherwise be kept for the life of the project. This removes the personal
-- fields from settled orders older than the retention window while keeping the
-- reference, totals, basket and payment audit trail needed for accounting.
-- Schedule it, for example with pg_cron:
--   select cron.schedule('redact-old-orders', '0 3 * * *', $$select public.redact_old_order_personal_data(365)$$);
create or replace function public.redact_old_order_personal_data(p_retain_days integer default 365)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  redacted integer;
begin
  if p_retain_days is null or p_retain_days < 30 then
    raise exception 'Refusing to redact orders newer than 30 days';
  end if;

  with cleared as (
    update public.orders
    set data = (data - 'deliveryAddress') || jsonb_build_object(
      'customer', jsonb_build_object('name', 'redacted', 'email', 'redacted', 'phone', 'redacted'),
      'orderNote', '',
      'personalDataRedactedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
    where created_at < now() - make_interval(days => p_retain_days)
      and status in ('completed', 'cancelled', 'expired', 'refunded', 'payment_failed')
      and data->>'personalDataRedactedAt' is null
    returning 1
  )
  select count(*)::integer into redacted from cleared;

  return redacted;
end;
$$;

revoke all on function public.redact_old_order_personal_data(integer) from public;
grant execute on function public.redact_old_order_personal_data(integer) to service_role;

create or replace function public.admin_auth_health()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'version', '2026-08-15-supabase-admin-auth-v1',
    'adminProfilesTable', to_regclass('public.admin_profiles') is not null,
    'adminAuditLogTable', to_regclass('public.admin_audit_log') is not null,
    'activeAdministrators', (select count(*) from public.admin_profiles where is_active = true)
  );
$$;

revoke all on function public.admin_auth_health() from public;
grant execute on function public.admin_auth_health() to service_role;

-- Constraints created NOT VALID protect new rows immediately. Validate them before
-- advancing the schema version so legacy invalid data cannot be mistaken for ready.
alter table public.orders validate constraint orders_status_check;
alter table public.orders validate constraint orders_provider_check;
alter table public.orders validate constraint orders_id_shape_check;
alter table public.order_payment_events validate constraint order_payment_events_provider_check;
alter table public.order_payment_events validate constraint order_payment_events_status_check;

insert into public.app_schema_versions (version, description)
values ('2026-08-15-supabase-admin-auth-v3', 'Supabase Auth administrator profiles, role authorization and audit logging')
on conflict (version) do nothing;

-- Readiness contract. Keep this last: if applying any required table or function above
-- fails, the version is never advanced and the matching application stays not-ready.
create or replace function public.order_database_health()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'version', '2026-08-15-supabase-admin-auth-v3',
    'ordersTable', to_regclass('public.orders') is not null,
    'paymentEventsTable', to_regclass('public.order_payment_events') is not null,
    'adminProfilesTable', to_regclass('public.admin_profiles') is not null,
    'adminAuditLogTable', to_regclass('public.admin_audit_log') is not null
  );
$$;

revoke all on function public.order_database_health() from public;
grant execute on function public.order_database_health() to service_role;
