@AGENTS.md

# TastyBites — frontend (Next.js app)

A restaurant ordering site (menu, cart, Stripe checkout) with an admin dashboard
(menu management, orders, contact messages, customer reviews, business
analytics). Backed by Supabase (Auth + Postgres + Row Level Security).

> Repo layout: the project is split into `frontend/` (this Next.js app) and
> `backend/` (standalone SQL/scripts). See the root `CLAUDE.md`. Anything Next.js
> imports via `@/...` must stay inside `frontend/`.

## Stack

- **Next.js 16.2.9** (App Router, Turbopack) — NOT the version in your training
  data. Read `node_modules/next/dist/docs/` before using a framework API. Notably
  `middleware` is renamed to **`proxy`** (see `proxy.js`).
- **React 19**, **Tailwind CSS v4**, plain **JavaScript** (no TypeScript).
- UI: shadcn-style components in `components/ui/` built on `@base-ui/react`;
  icons from `lucide-react`; toasts from `sonner`.
- **Supabase** for auth + database; **Stripe** for payments; **Resend** for email.

## Commands

```bash
npm run dev        # start dev server (http://localhost:3000)
npm run build      # production build — run to verify changes compile
npm run start      # serve the production build
npm run lint       # eslint
npm run db:migrate # apply pending SQL migrations to Supabase + verify tables
```

Do NOT run `npm run build` while `npm run dev` is running — both use `.next`
(Turbopack) and the concurrent access crashes the dev server.

## Layout

- `app/` — routes. Public: `/`, `/menu`, `/menu/[id]`, `/cart`, `/contact`.
  Admin: `/admin` (dashboard), `/admin/login`, `/admin/signup`. Customer auth
  lives under `app/account/`.
- `app/api/` — route handlers: `checkout`, `order/confirm` (Stripe),
  `contact`, `reviews` (public form submissions; service-role inserts).
- `components/` — shared UI; `components/admin/` is the dashboard.
- `lib/` — `supabase/{client,server,admin}.js` (browser / cookie-server /
  service-role clients), `menu-data.js` (public reads via REST + anon key),
  `admin-metrics.js` (analytics), `order-pricing.js`, `order-status.js`,
  `email.js` (Resend), `detect-category.js`.
- `context/CartContext.js` — client-side cart state.
- `proxy.js` — refreshes the Supabase session and guards `/admin/*`.
- `supabase/migrations/` — SQL schema + RLS (also runnable from here).

## Supabase clients — pick the right one

- **`lib/supabase/client.js`** (anon, browser) — Client Components, public reads.
- **`lib/supabase/server.js`** (anon + cookies) — Server Components / actions; RLS
  applies as the signed-in user.
- **`lib/supabase/admin.js`** (service-role, **server-only**) — bypasses RLS. Use
  only for trusted server work (recording paid orders, storing public form
  submissions). Never import into a Client Component.

## Auth & security

- Roles live in `public.profiles.role` (`customer` | `admin`). `private.is_admin()`
  powers RLS policies. Promote a user with `backend`/`supabase` admin SQL.
- `proxy.js` blocks anonymous access to `/admin/*` (except `login`/`signup`).
- **Every admin Server Action re-checks the admin role** (`requireAdmin()` in
  `app/admin/actions.js`) — Server Actions are reachable by direct POST, so the
  proxy guard alone is not enough.
- Public form submissions (contact, reviews) insert via the service-role key in a
  route handler; reviews/messages are only readable by admins (or, for reviews,
  once `is_approved = true`).

## Admin dashboard

`app/admin/page.js` is a Server Component that fetches everything and passes
server-rendered sections into `components/admin/AdminShell.jsx` (a tabbed
switcher: Overview / Menu / Orders / Messages / Reviews / Account). The Overview
analytics window is URL-driven (`?range=6m`) via `RangeFilter`, computed by
`lib/admin-metrics.js`. Orders/menu lists paginate and filter client-side.

## Database changes

Add a numbered file in `supabase/migrations/` (e.g. `0006_*.sql`), then run
`npm run db:migrate`. Migrations are applied once and tracked in
`public.schema_migrations`, so a feature is never silently broken by an
un-applied migration. Migrations are NOT all idempotent — never re-run an
already-applied one by hand; let the runner skip it.

## Environment (`.env.local`, gitignored)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only), `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and optionally `RESEND_API_KEY` +
`CONTACT_NOTIFY_TO` (contact emails are skipped gracefully if unset).
