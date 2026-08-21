# Orders and payments

The menu catalogue in `app/lib/menu.ts` is the only price source. Checkout sends menu IDs and quantities; `app/lib/orders.ts` rebuilds every order and total on the server before a payment is created.

## Local setup

1. Copy `.env.example` to `.env.local` and add test credentials.
2. Run `pnpm dev`.
3. In development only, orders fall back to `.data/orders.json`. Production deliberately refuses new orders without Supabase.
4. Before deploying the matching application build, run the current `supabase/schema.sql` in the Supabase SQL editor and set `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, plus the preferred server-only `SUPABASE_SECRET_KEY`. The legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported, but do not set both. Follow [SUPABASE.md](./SUPABASE.md) for administrator provisioning and the complete database contract.

Every checkout receives a server-generated order reference. The browser idempotency key is stored only as a SHA-256 digest, and a separate signed HTTP-only cookie controls access to the customer order page and status API.

## Stripe

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Stripe uses its full hosted Checkout page and redirects to the session URL returned by Stripe, so this implementation does not load Stripe.js or require a publishable `pk_*` key. A publishable key would only become necessary if checkout were changed to embedded Checkout or Elements. Card data never enters this application.

Register `POST /api/webhooks/stripe` for Checkout Session completed, async succeeded/failed and expired events, plus `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, and `payment_intent.canceled`. Every event is resolved back to its Checkout Session and checked against the stored provider reference, order ID, amount and currency before it can change payment state. The success and customer order pages perform authenticated session reconciliation when a signed webhook is delayed. Stripe creates a different endpoint signing secret for Dashboard test mode, Dashboard live mode and local Stripe CLI forwarding; use the secret that belongs to the exact endpoint being tested.

Production readiness requires live Stripe credentials. Test credentials work locally, but cannot make the production readiness endpoint healthy.

## Administrator operations

The private portal is served at `/admin`. It includes a live overview, complete order register, kitchen board, daily/monthly reports, deployment readiness, individual order details and staff-only operations notes. Administrators cannot create payment success: signed provider events establish payment state, and the portal can only advance valid fulfilment transitions after payment is confirmed.

1. Apply `supabase/schema.sql` and confirm both database health functions return the expected versions.
2. Create the staff identity in Supabase Dashboard → Authentication → Users using the administrator's email and a strong unique password.
3. Activate the generated `admin_profiles` row and assign a role by following [SUPABASE.md](./SUPABASE.md). New Auth users are inactive by default.
4. Set a random `ADMIN_SESSION_SECRET` and a separate `ORDER_ACCESS_SECRET`, each at least 32 characters.
5. Sign in at `/admin/login` with the Supabase Auth email and password. Sessions are HTTP-only, SameSite Strict, signed, limited to eight hours and revalidated against the active profile on every request.

Roles are `owner`, `admin`, `manager`, `kitchen` and `viewer`. The application and database both enforce the role required for order transitions and private notes. Incrementing a profile's `session_version` immediately invalidates all existing application sessions for that user.

## Operational notes

- Never expose Stripe, Brevo, webhook, or Supabase secret/service-role credentials to the browser.
- Use separate test and live environment variables.
- Keep `NEXT_PUBLIC_SITE_URL` on the final HTTPS origin so provider redirects return correctly.
- Do not treat a checkout return URL as proof of payment. Only an authenticated provider query or atomic signed webhook may establish paid state.
- A refund, partial refund, dispute or reversal immediately locks administrator fulfilment controls. Reconciliation occurs in the provider dashboard; this application never silently restores `paid` from a later duplicate event.
- In-memory request throttling limits opportunistic abuse per running instance. Add an edge/WAF rate limit for distributed production protection.
- Delivery is enabled with a configurable fee. Confirm the service radius, opening times, lead times, minimum order and refund policy before launch.
