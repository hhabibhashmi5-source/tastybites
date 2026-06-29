# PRD — Supabase Integration for TastyBites

**Product:** TastyBites (Next.js restaurant ordering site)
**Author:** TastyBites team
**Date:** 2026-06-23
**Status:** Draft v1

---

## 1. Overview

TastyBites is currently a **frontend-only** Next.js app: the menu is hard-coded in
`lib/menu.js`, the cart lives in the browser's `localStorage`, and Stripe Checkout
handles payment. There is **no database, no user accounts, and no record of orders**
once a payment completes.

This PRD describes adding **Supabase** as the backend to give TastyBites a real
database, authentication, file storage, and a place to persist orders — turning it
from a demo into a functioning product.

---

## 2. Background & current state

| Area | Today | Limitation |
|------|-------|------------|
| Menu data | Static array in `lib/menu.js` | Can't change menu without a code deploy |
| Images | Local files in `/public/images` | Manual; no upload flow |
| Cart | `localStorage` (`tastybites-cart`) | Fine to keep client-side |
| Checkout | Stripe Checkout via `/api/checkout` | Works, but order is never saved |
| Orders | None | No history, no fulfilment, no admin view |
| Users | None | No accounts, no reorder, no saved address |
| Admin | None | Owner can't manage menu or see orders |

---

## 3. Goals & non-goals

### Goals
1. Store the **menu** in Supabase so it can be edited without redeploying.
2. **Persist orders** when a Stripe payment succeeds.
3. Add **customer accounts** (email/password + magic link) for order history and saved details.
4. Provide an **admin role** that can manage menu items and view incoming orders.
5. Use **Supabase Storage** for menu photos with an upload flow.
6. Enforce data access with **Row Level Security (RLS)**.

### Non-goals (this phase)
- Replacing Stripe (Supabase does not handle payments).
- Real-time kitchen display system (future phase).
- Delivery driver tracking / maps.
- Multi-restaurant / multi-tenant support.

---

## 4. Users & roles

| Role | Description | Access |
|------|-------------|--------|
| **Guest** | Not logged in | Browse menu, add to cart, check out as guest |
| **Customer** | Signed-in diner | Above + order history, saved address, faster checkout |
| **Admin** | Restaurant owner/staff | Manage menu, view & update order status |

Role is stored as a column on a `profiles` table; admin access is gated by RLS and
checked server-side.

---

## 5. Data model (Postgres / Supabase)

### `profiles`
Mirrors `auth.users`, holds app-specific fields.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | = `auth.users.id` |
| full_name | text | |
| phone | text | |
| default_address | text | |
| role | text | `'customer'` \| `'admin'`, default `'customer'` |
| created_at | timestamptz | default `now()` |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | "Fast Food", "Drinks", "Desserts" |
| sort_order | int | |

### `menu_items`
Replaces the static `MENU_ITEMS` array.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| description | text | |
| price | numeric(10,2) | |
| category_id | uuid (FK → categories) | |
| image_url | text | Supabase Storage public URL |
| rating | numeric(2,1) | |
| is_featured | boolean | default false |
| is_available | boolean | default true |
| created_at | timestamptz | |

### `orders`
Created when Stripe checkout succeeds.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles, nullable) | null for guest orders |
| customer_name | text | |
| phone | text | |
| address | text | |
| subtotal | numeric(10,2) | |
| delivery_fee | numeric(10,2) | |
| total | numeric(10,2) | |
| status | text | `'paid' \| 'preparing' \| 'out_for_delivery' \| 'delivered'` |
| stripe_session_id | text | unique; idempotency key |
| created_at | timestamptz | |

### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| order_id | uuid (FK → orders) | |
| menu_item_id | uuid (FK → menu_items) | |
| name | text | snapshot at purchase time |
| price | numeric(10,2) | snapshot |
| quantity | int | |

---

## 6. Row Level Security (RLS) summary

- `menu_items`, `categories`: **public read**; **write = admin only**.
- `profiles`: a user can read/update **their own** row; admins can read all.
- `orders` / `order_items`: a user can read **their own** orders; **inserts happen
  server-side only** (via the service-role key in the Stripe success handler);
  admins can read/update all.

---

## 7. Functional requirements

### 7.1 Menu from the database
- Menu pages (`/menu`, `/menu/[id]`, home "Popular picks") fetch from `menu_items`
  instead of importing `lib/menu.js`.
- Items with `is_available = false` are hidden from customers.
- `is_featured` drives the home "Popular picks" and hero thumbnails.

### 7.2 Authentication
- Sign up / log in with **email + password** and **magic link** (Supabase Auth).
- On first sign-in, create a `profiles` row (DB trigger).
- Logged-in checkout pre-fills name / phone / address from the profile.
- A `/account` page shows profile + order history.

### 7.3 Persisting orders
- The Stripe success path records the order:
  - **Preferred:** a **Stripe webhook** (`checkout.session.completed`) → a Supabase
    Edge Function (or Next.js route using the **service-role key**) inserts into
    `orders` + `order_items`, keyed by `stripe_session_id` (idempotent).
  - The `/cart?success=…` page reads the saved order to confirm.
- Order `status` starts at `'paid'`.

### 7.4 Admin
- `/admin` (admin-only): list incoming orders, update `status`.
- `/admin/menu`: create / edit / toggle availability of menu items, upload photos.

### 7.5 Image storage
- A public Storage bucket `menu-images`; admin uploads return a public URL stored in
  `menu_items.image_url`.

---

## 8. Technical integration plan

1. **Create Supabase project**; copy `Project URL` + `anon` key + `service_role` key.
2. **Env vars** (add to `.env.local`, alongside Stripe):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only — never expose to the client)*
3. **Install:** `@supabase/supabase-js` and `@supabase/ssr` (for Next.js App Router
   server/client clients & cookie-based sessions).
4. **Clients:**
   - Browser client (anon key) for public reads and auth.
   - Server client (service-role) used only in API routes / webhooks for writes.
5. **Schema:** apply SQL migrations for the tables above + RLS policies.
6. **Seed:** migrate the existing `lib/menu.js` items into `menu_items` once.
7. **Refactor** menu pages to fetch from Supabase; keep `lib/menu.js` as a fallback
   until the cutover is verified.
8. **Stripe webhook** → write order on `checkout.session.completed`.

---

## 9. Milestones

| Phase | Deliverable |
|-------|-------------|
| **0. Setup** | Supabase project, env vars, clients wired, schema + RLS applied |
| **1. Menu** | Menu read from DB; seed migration from `lib/menu.js` |
| **2. Orders** | Stripe webhook persists orders; success page reads them |
| **3. Auth** | Sign up / log in, profile, `/account` order history |
| **4. Admin** | `/admin` order management + `/admin/menu` editing & image upload |

---

## 10. Success metrics
- 100% of paid Stripe sessions produce exactly one `orders` row (no dupes/missing).
- Menu can be updated by an admin with **zero code deploys**.
- Returning customers can reorder from history in ≤ 3 clicks.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Service-role key leaking to client | Only ever read in server routes / Edge Functions; never `NEXT_PUBLIC_` |
| Duplicate orders from webhook retries | Unique `stripe_session_id` + upsert/idempotency |
| RLS misconfiguration exposing data | Test policies per role; default-deny, add explicit allows |
| Price tampering on the client | Server recomputes totals from DB prices before creating the Stripe session |
| Migration drift (DB vs `lib/menu.js`) | Single seed step, then remove static data after cutover |

---

## 12. Open questions
- Guest checkout allowed, or require an account?
- Do we need order email receipts (Stripe email vs. custom)?
- Delivery zones / minimum order value?
- Inventory limits per item, or unlimited?
