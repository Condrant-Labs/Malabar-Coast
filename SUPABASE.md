# Supabase database and administrator authentication

This project uses one Supabase project for durable order storage, payment-event audit records, administrator identities and role authorization. Card data never enters Supabase: Stripe hosts card collection.

## Required environment values

| Variable | Where used |Requirement |
| --- | --- | --- |
| `SUPABASE_URL` | Server database and Auth requests | Project URL from Supabase Connect. HTTPS in production. |
| `SUPABASE_SECRET_KEY` | Server-only PostgREST and RPC access | Preferred `sb_secret_...` key. Never expose it to a browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy server fallback | Use only when a secret key is unavailable. Do not configure both server keys. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Auth and Realtime notification hints | Current `sb_publishable_...` key. Safe to expose, but subject to RLS and grants. |
| `ADMIN_SESSION_SECRET` | Application administrator session and CSRF signatures | Unique random value of at least 32 characters. |
| `ORDER_ACCESS_SECRET` | Customer order-page access grants | A different random value of at least 32 characters. |

## Deployment order

1. Create or select the production Supabase project.
2. In SQL Editor, run the complete current [`supabase/schema.sql`](./supabase/schema.sql) as one migration. It is idempotent and includes tables, indexes, constraints, triggers, grants, RLS, functions and health contracts.
3. Confirm the health queries below report the exact versions expected by this application.
4. Create each staff identity in Dashboard → Authentication → Users. Require a confirmed email and a strong unique password. Supabase Auth owns password hashing, password reset and identity security.
5. Activate the corresponding profile with the minimum role required.
6. Add the environment variables to the deployment secret manager and redeploy.
7. Test login, logout, each authorized role, a denied role, order transition auditing and session revocation before enabling production traffic.

## Tables

### `public.orders`

Durable order record. The typed lifecycle columns (`id`, `status`, `provider`, idempotency hashes and timestamps) support constraints and indexes; the validated server-built order snapshot remains in `data` JSONB. Customer input never determines menu prices or totals.

- Primary key: generated `ord_...` reference.
- Unique partial index: checkout idempotency-key hash.
- Indexes: creation time, lifecycle status and lower-cased customer email inside the private JSON document.
- RLS enabled; `anon` and `authenticated` have no table privileges.

### `public.order_payment_events`

Append-only provider-event identity and financial transition record. Its `(provider, event_id)` primary key makes signed webhook processing idempotent. Provider reference, amount and currency are checked against the order before a financial state can change.

### `public.admin_profiles`

Application authorization for identities stored in `auth.users`.

- `user_id`: foreign key to `auth.users`, cascade deleted.
- `email`: normalized identity email used for an additional login consistency check.
- `display_name`: staff-facing name.
- `role`: `owner`, `admin`, `manager`, `kitchen` or `viewer`.
- `is_active`: deny-by-default access switch.
- `session_version`: increment to revoke every existing application session immediately.
- `last_login_at`, `created_at`, `updated_at`, `created_by`: operational lifecycle fields.

The Auth-user trigger creates an inactive `viewer` profile. Authentication alone never grants portal access.

### `public.admin_audit_log`

Append-only audit records for Supabase Auth login/logout, order status transitions and private note updates. It stores actor ID plus email/role snapshots, action, target and limited non-sensitive metadata. It never stores passwords, tokens, notes or customer addresses.

### `public.app_schema_versions`

Records successfully applied application schema milestones. Runtime readiness still depends on the health RPC version, so a partially applied SQL file cannot report ready.

## Role matrix

| Capability | Owner | Admin | Manager | Kitchen | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Dashboard and order register | ✓ | ✓ | ✓ | ✓ | ✓ |
| Kitchen board | ✓ | ✓ | ✓ | ✓ | — |
| Advance paid fulfilment | ✓ | ✓ | ✓ | ✓ | — |
| Write private operations notes | ✓ | ✓ | ✓ | — | — |
| Sales reports | ✓ | ✓ | ✓ | — | — |
| Deployment readiness | ✓ | ✓ | — | — | — |

The route handlers check these permissions before accessing data. The SQL functions separately require an active profile and an allowed role before changing an order.

## Create the first owner

Create the user in Supabase Auth first, then run this in SQL Editor with the real email:

```sql
update public.admin_profiles
set
  display_name = 'Restaurant Owner',
  role = 'owner',
  is_active = true,
  session_version = session_version + 1
where lower(email) = lower('owner@example.com');
```

The update must affect exactly one row. If it affects zero, confirm the Auth user exists and rerun `supabase/schema.sql` so the safe backfill creates the inactive profile.

For another staff member, create the Auth user first and use the same update with the minimum appropriate role. Never share one administrator account between staff.

## Disable access or revoke sessions

Disable a user and invalidate every existing session:

```sql
update public.admin_profiles
set is_active = false, session_version = session_version + 1
where lower(email) = lower('staff@example.com');
```

To keep access active but force a fresh login, increment only `session_version`. Password changes remain managed through Supabase Auth.

## Database functions

- `create_checkout_order`: atomically claims an idempotency key and creates or reuses a matching checkout.
- `attach_checkout_provider_reference`: binds the immutable hosted-checkout identity and URL.
- `apply_order_payment_event`: idempotently validates and applies signed provider lifecycle events.
- `transition_order_status`: validates active staff role, locks the order, permits only the next paid fulfilment state, and writes an audit record atomically.
- `update_order_admin_notes`: validates an active note-writing role, updates private notes and writes metadata-only audit evidence atomically.
- `record_admin_login` / `record_admin_logout`: record Auth-backed portal session activity.
- `redact_old_order_personal_data`: removes customer contact and delivery details from settled records after the configured retention period.
- `order_database_health` / `admin_auth_health`: deployment compatibility contracts used by readiness checks.

Every security-definer function fixes `search_path`, revokes `public` execution and grants only `service_role`. Tables have RLS enabled and grant no direct access to `anon` or `authenticated`.

## Verification queries

Run after applying the schema:

```sql
select public.order_database_health();
select public.admin_auth_health();

select version, description, applied_at
from public.app_schema_versions
order by applied_at desc;

select email, display_name, role, is_active, session_version, last_login_at
from public.admin_profiles
order by created_at;
```

Expected versions:

- Order/database contract: `2026-08-15-supabase-admin-auth-v3`
- Administrator-auth contract: `2026-08-15-supabase-admin-auth-v1`

The public readiness endpoint is `/api/health/ready`. Detailed failures are returned only to an authenticated administrator or a monitor presenting `HEALTH_CHECK_TOKEN`.

## Production checklist

- Use separate Supabase projects or credentials for development/test and production.
- Disable public sign-up unless the business explicitly needs it. Staff accounts should be invited or created by an owner.
- Require confirmed email; consider MFA enforcement in Supabase Auth for privileged staff.
- Keep secret/service-role keys only in the server deployment secret manager.
- Never add database keys, Auth tokens or SQL dumps containing customer data to Git.
- Configure database backups and test recovery.
- Schedule `redact_old_order_personal_data` only after the business approves its accounting and privacy retention period.
- Review active profiles and the audit log regularly; deactivate departing staff immediately.
- Test signed Stripe webhooks against the live deployment. Local schema checks do not replace provider acceptance testing.
