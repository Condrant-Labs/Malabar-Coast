# Malabar Coast

A Next.js website and online ordering system for Malabar Coast, a Kerala-inspired restaurant.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Webpack build)
- React 19, TypeScript
- Tailwind CSS
- GSAP + Lenis for scroll and motion
- Supabase for durable order storage
- Stripe for hosted card payments

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in test credentials. See [PAYMENTS.md](./PAYMENTS.md) for checkout providers and [SUPABASE.md](./SUPABASE.md) for the database and administrator-auth deployment contract.

In development only, orders fall back to `.data/orders.json` when Supabase is not configured. Production refuses new orders without Supabase.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run database, authentication, payment and security contract tests |

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

Run the current `supabase/schema.sql` before deploying the matching application build. Supabase Auth verifies staff identity; the private `admin_profiles` table applies least-privilege roles. The portal uses a server-only Supabase secret key (or legacy service-role key) for protected operations and never connects a browser directly to private order or administrator tables.

## Documentation

- [PAYMENTS.md](./PAYMENTS.md) — orders and Stripe integration notes
- [SUPABASE.md](./SUPABASE.md) — database schema, administrator roles, provisioning and deployment verification
- [SECURITY.md](./SECURITY.md) — admin access, private order routes, headers and launch checklist
- [BOOKINGS_AND_EMAIL.md](./BOOKINGS_AND_EMAIL.md) — table capacity, hall workflow, Brevo setup and deployment order
- [LESSONS.md](./LESSONS.md) — responsive design and editorial composition notes
- [progress.txt](./progress.txt) — build log
