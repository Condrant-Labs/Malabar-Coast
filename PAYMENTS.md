# Orders and payments

The menu catalogue in `app/lib/menu.ts` is the only price source. Checkout sends menu IDs and quantities; `app/lib/orders.ts` rebuilds every order and total on the server before a payment is created.

## Local setup

1. Copy `.env.example` to `.env.local` and add test credentials.
2. Run `pnpm dev`.
3. In development only, orders fall back to `.data/orders.json`. Production deliberately refuses new orders without Supabase.
4. Before deploying the matching application build, run the current `supabase/schema.sql` in the Supabase SQL editor and set `SUPABASE_URL` plus the preferred server-only `SUPABASE_SECRET_KEY`. The legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported, but do not set both. The checkout-claim, provider-attachment, admin-transition and payment-event functions are all required.

Every checkout receives a server-generated order reference. The browser idempotency key is stored only as a SHA-256 digest, and a separate signed HTTP-only cookie controls access to the customer order page and status API.

## Stripe

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Stripe uses its full hosted Checkout page; card data never enters this application. Register `POST /api/webhooks/stripe` for Checkout Session completed, async succeeded/failed and expired events, plus `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, and `payment_intent.canceled`. Every event is resolved back to its Checkout Session and checked against the stored provider reference, order ID, amount and currency before it can change payment state. The success and customer order pages perform authenticated session reconciliation when a signed webhook is delayed.

## Worldpay

Set the Access API username/password, merchant entity, and `WORLDPAY_ENVIRONMENT=try`. The merchant entity is available in Worldpay Dashboard under Developer Tools and commonly starts with `PO`. This integration uses full-page Hosted Payment Pages, so `NEXT_PUBLIC_WORLDPAY_CHECKOUT_ID` and browser card sessions are not used. Worldpay captures card data, 3DS and enabled wallets on its own page.

Register `POST /api/webhooks/worldpay`, ask Worldpay to enable the `Event-Signature` header, and store the shared secret as `WORLDPAY_WEBHOOK_SECRET`. The endpoint verifies the HMAC against the untouched request body before parsing JSON. Unsigned requests and legacy Basic authentication are not accepted.

The endpoint is idempotent by event ID. Event types are matched against the explicit table in `app/lib/payments/worldpay-events.ts`; anything outside it is logged as `Ignored an unmapped Worldpay event type` and changes nothing. HPP sends value data as `eventDetails.amount.value` and `eventDetails.amount.currencyCode`; both are checked with the order and provider payment ID before financial state changes.

Worldpay creates its `paymentId` after the customer submits the hosted page. Checkout therefore stores only the HPP URL initially. The first verified webhook or authenticated Payment Queries response atomically binds the real `paymentId`. The success and customer order pages query by the server-generated `transactionReference` while a webhook is delayed; a missing or delayed query always remains pending.

Keep `WORLDPAY_CHECKOUT_ENABLED=false` until the Try HPP redirect, authorized/refused results, expiry return, signed webhook and delayed-query reconciliation pass acceptance. Production and live-mode builds fail closed unless HMAC webhook signing is configured.

## Administrator operations

The private portal is served at `/admin`. It includes a live overview, complete order register, kitchen board, daily/monthly reports, deployment readiness, individual order details and staff-only operations notes. Administrators cannot create payment success: signed provider events establish payment state, and the portal can only advance valid fulfilment transitions after payment is confirmed.

1. Generate a password hash with `pnpm admin:hash -- "a long unique password"`. The output is `scrypt:N=32768,r=8,p=1:<salt>:<hash>`.

   The separator is a colon because Next.js reads `.env` files through dotenv-expand, which treats `$name` as a variable reference. Any hash containing `$` — including the older `scrypt$<salt>$<hash>` layout — is silently rewritten to a shorter string when it comes from a `.env` file, and `/admin/login` then reports "setup required" with no other explanation. Dollar-separated hashes are still accepted from platform environment editors such as Vercel, which do not expand, but regenerate them so the value is safe everywhere.
2. Set `ADMIN_USERNAME`, the generated `ADMIN_PASSWORD_HASH`, and a random `ADMIN_SESSION_SECRET` of at least 32 characters.
3. Set a separate random `ORDER_ACCESS_SECRET` of at least 32 characters.
4. Sign in at `/admin/login`. Sessions are HTTP-only, SameSite Strict, signed and limited to eight hours.

## Operational notes

- Never expose Stripe, Worldpay API, webhook, or Supabase secret/service-role credentials to the browser.
- Use separate test and live environment variables.
- Keep `NEXT_PUBLIC_SITE_URL` on the final HTTPS origin so provider redirects return correctly.
- Do not treat a checkout return URL as proof of payment. Only an authenticated provider query or atomic signed webhook may establish paid state.
- A refund, partial refund, dispute or reversal immediately locks administrator fulfilment controls. Reconciliation occurs in the provider dashboard; this application never silently restores `paid` from a later duplicate event.
- In-memory request throttling limits opportunistic abuse per running instance. Add an edge/WAF rate limit for distributed production protection.
- Delivery is enabled with a configurable fee. Confirm the service radius, opening times, lead times, minimum order and refund policy before launch.
