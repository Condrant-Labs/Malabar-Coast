# Malabar Coast

A Next.js website and online ordering system for Malabar Coast, a Kerala-inspired restaurant.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Webpack build)
- React 19, TypeScript
- Tailwind CSS
- GSAP + Lenis for scroll and motion
- Supabase for durable order storage
- Stripe and Worldpay for payments

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in test credentials. See [PAYMENTS.md](./PAYMENTS.md) for the full checkout, Stripe, Worldpay and Supabase setup.

In development only, orders fall back to `.data/orders.json` when Supabase is not configured. Production refuses new orders without Supabase.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm admin:hash -- "long password"` | Generate a scrypt administrator password hash |

## Project structure

```
app/            Routes, pages, API handlers, menu and checkout logic
public/         Static assets (images, robots.txt, sitemap, manifest)
supabase/       Database schema
```

## Restaurant operations portal

The private portal begins at `/admin` and includes:

- a live overview of confirmed sales, orders due and kitchen workload;
- a complete searchable order register with payment-safe status advancement;
- a kitchen board for new, accepted, making, ready and delivery stages;
- daily collection, monthly sales, order-mix and dish-performance reporting;
- per-order customer, basket, audit history and staff-only operations notes; and
- a read-only deployment and security readiness page.

Run the current `supabase/schema.sql` before deploying the matching application build. The portal uses a server-only Supabase secret key (or legacy service-role key) and never connects a browser directly to the orders table.

## Documentation

- [PAYMENTS.md](./PAYMENTS.md) — orders, Stripe, and Worldpay integration notes
- [SECURITY.md](./SECURITY.md) — admin access, private order routes, headers and launch checklist
- [LESSONS.md](./LESSONS.md) — responsive design and editorial composition notes
- [progress.txt](./progress.txt) — build log
