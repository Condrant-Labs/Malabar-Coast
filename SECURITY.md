# Security and operations

## Trust boundaries

- Menu IDs and quantities are accepted from the browser; names, availability, prices and totals are rebuilt on the server.
- Stripe and Brevo secrets, webhook credentials and the Supabase secret/service-role key are server-only.
- Customer order pages and `/api/orders/[id]` require a signed HTTP-only order-access cookie. The cookie carries the ten most recent orders from that browser, so a second checkout no longer revokes access to the first.
- `/admin` authenticates email and password through Supabase Auth, then requires an active `admin_profiles` row with the required least-privilege role. The application issues a signed, HTTP-only, SameSite Strict eight-hour session and rechecks role, active state and `session_version` on every request. Incrementing `session_version` or deactivating the profile invalidates every issued session. State-changing requests also require same origin and a session-bound CSRF token.
- Payment state can only be applied through authenticated Stripe events or a Checkout Session verified directly with Stripe.
- Rate limiting reads the client address from the right of `x-forwarded-for`, after `TRUSTED_PROXY_COUNT` hops, or from an edge header the platform overwrites. Reading the left-most entry would let any client forge an address and reset every bucket. Set `TRUSTED_PROXY_COUNT` to match the deployment.
- Table and hall submissions are same-origin, size-limited, server-validated and rate-limited. Seat capacity is claimed atomically in the database; public database roles have no direct table or function access.
- Brevo API credentials remain server-only. Email HTML escapes customer-controlled values, and a private delivery log prevents duplicate messages during webhook or request retries.

## Response protection

`proxy.ts` issues the Content Security Policy with a per-request nonce. `'strict-dynamic'` lets the nonce-approved bootstrap load application chunks. The policy retains `'unsafe-inline'` only as a legacy fallback; nonce-aware browsers ignore it when the nonce is present. `next.config.ts` adds clickjacking protection, MIME sniffing protection, HTTPS transport policy, limited browser permissions and strict referrer handling. Do not also set a policy in `next.config.ts`: two policies are both enforced and the intersection breaks the page.

Admin, order, checkout and API routes receive no-index headers from `next.config.ts` and `Cache-Control: no-store` from `proxy.ts`. The header is reapplied there because Next.js replaces a configured `no-store` with `no-cache, must-revalidate` when it renders a dynamic page, which would leave pages containing customer contact details and addresses eligible for the browser disk cache. `next dev` still reports `no-cache` for its own reasons; verify this header against `next build && next start`.

## Payment event integrity

Stripe Checkout keeps card data and 3DS outside this application. Signed webhook events and authenticated Checkout Session lookups must match the provider reference, order identity, amount and currency before paid or another irreversible state can be applied.

`supabase/schema.sql` owns all state-changing order invariants. `order_database_health` and `admin_auth_health` version the required migration for readiness checks. `create_checkout_order` atomically claims a unique idempotency digest; `attach_checkout_provider_reference` binds the provider identity without stale JSON replacement; `transition_order_status` and `update_order_admin_notes` validate the active staff role and write audit evidence in the same transaction; and `apply_order_payment_event` deduplicates and validates provider reference, amount and currency. Run the current schema before enabling the matching production build. Webhooks and administrator mutations fail closed when authentication, authorization, provider verification or a database function is missing.

Refunded, disputed, partially refunded and reversed payments cannot advance through fulfilment. Late `paid` duplicates cannot reopen these irreversible states.

Administrator controls cannot manually mark an order paid. The allowed fulfilment sequence is:

`paid → confirmed → preparing → ready → out for delivery/completed → completed`

Collection orders omit the delivery step.

## Production launch checklist

- Use a final HTTPS `NEXT_PUBLIC_SITE_URL`; never rely on the request Host header for payment returns.
- Configure Supabase and run the current schema. Confirm both health RPC versions, create staff in Supabase Auth, and activate only the minimum required `admin_profiles` roles. Production checkout must not use local JSON storage.
- Configure Stripe test keys and signed webhooks, then test paid, asynchronous, failed and expired sessions.
- Generate separate high-entropy values for `ADMIN_SESSION_SECRET` and `ORDER_ACCESS_SECRET`.
- Store all secrets in the deployment secret manager, not source control or public variables.
- Configure the verified Brevo sender and owner inbox, then test customer and owner delivery without exceeding the account's daily allowance.
- Apply platform/WAF throttling to `/api/checkout`, `/api/reservations`, `/api/hall-enquiries`, `/api/orders/*`, `/api/admin/*` and the Stripe webhook path.
- Confirm refunds, delivery radius, operating hours, lead times, minimum order and privacy/retention policy before launch.
- Have the owner and qualified advisers approve the privacy, cookie, payment, cancellation and refund pages before accepting live orders.
- Configure monitoring for checkout failures, webhook failures and repeated administrator login rejection.
- Back up Supabase and schedule `public.redact_old_order_personal_data(365)`. Customer name, email, phone, delivery address and order note are stored inside `orders.data` and are otherwise kept for the life of the project; the function clears them from settled orders past the window while keeping the reference, basket, totals and payment audit trail.
- Set `TRUSTED_PROXY_COUNT` to the number of proxies that append to `x-forwarded-for`, and `HEALTH_CHECK_TOKEN` if an uptime monitor needs the individual readiness checks.

## Verification before each release

1. Run `pnpm test`, `pnpm lint`, `pnpm audit --prod` and `pnpm build`.
2. Inspect headers on `/`, `/checkout`, `/order/test`, `/admin/login` and `/api/payment-config`, against `next start` rather than `next dev`.
3. Confirm private routes return `X-Robots-Tag` and `Cache-Control: no-store`, and that `script-src` carries a fresh `nonce-` value with `'strict-dynamic'`; `'unsafe-inline'` may appear only as the documented legacy fallback.
4. Confirm the browser console reports no CSP violation on `/`, `/menu`, `/story` and `/checkout`.
5. Confirm unsigned Stripe webhook requests are rejected.
6. Confirm order status is unavailable without its signed cookie.
7. Confirm an administrator cannot skip fulfilment steps or establish payment manually.
8. Confirm inactive Auth users cannot log in; `viewer` cannot mutate; `kitchen` cannot write notes; `manager` cannot open settings; and a `session_version` increment revokes an existing session.
9. Confirm administrator login/logout, status transitions and note updates appear in `admin_audit_log` without passwords, tokens, notes or customer details.
10. Confirm `/api/health/ready` returns no `checks` object without an administrator session or `HEALTH_CHECK_TOKEN`.
