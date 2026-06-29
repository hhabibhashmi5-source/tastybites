# Phase 1 — Menu from Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the website read its menu (food items, prices, categories) from the Supabase database instead of the hard-coded `lib/menu.js` file.

**Architecture:** Add one tiny pure "mapper" file that converts a database row into the shape the existing UI already expects, and one "data-access" file with server functions that fetch from Supabase and map the rows. Then point the menu page, home page, and search at those functions instead of the static array. Components (`MenuCard`, `Tabs`) stay unchanged because the mapper preserves the old field names.

**Tech Stack:** Next.js 16 (App Router, React Server Components), `@supabase/ssr` + `@supabase/supabase-js`, Supabase Postgres.

## Global Constraints

- This is a **modified Next.js 16** — Route Handlers/Server Components follow the bundled docs in `node_modules/next/dist/docs/`. Server Components are `async` functions with NO `"use client"`.
- Supabase reads use the **anon key** via the existing clients in `lib/supabase/`. Public read is allowed by the RLS policies already applied (`menu_items_read`, `categories_read` → `using (true)`).
- The browser-safe client is `lib/supabase/client.js` (`createClient()`); the server client is `lib/supabase/server.js` (`async createClient()`). **Never** import `lib/supabase/server.js` or `lib/supabase/admin.js` into a Client Component (`"use client"`).
- Keep `lib/menu.js` on disk as a fallback/reference until the whole phase is verified working. Do not delete it in this phase.
- Customers must only see available items: every customer-facing query filters `is_available = true`.
- Field mapping (DB → UI), applied everywhere: `image_url → image`, `is_featured → featured`, `categories.name → category`, and `price`/`rating` cast to `Number`.

## Prerequisites (one-time)

- **Database is seeded**: `0001_init.sql` and the seed (13 items) have been run in Supabase. Verify in Supabase → Table Editor → `menu_items` shows 13 rows with prices.
- **Env vars present** in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. (Already done.)
- **Restart the dev server** after this point so it loads the Supabase env vars: stop the running server and run `npm run dev` again. (Env changes are only picked up on restart.)
- **Git (optional but recommended):** if `git status` errors with "not a repository", run `git init` once so the commit steps work. If you prefer not to use git, just skip every "Commit" step.

> **Note on testing:** this project has no automated test framework set up, and wiring one up (plus mocking Supabase) is out of scope for a beginner's first DB feature. So each task is verified by **running the app and observing real output** (via `curl` + checking the rendered HTML contains the expected food names). That is a real, honest verification — if the name appears in the page HTML, the data came from the database.

---

### Task 1: Pure row-mapper (`lib/menu-map.js`)

A single source of truth for "what a DB menu row looks like" and "how to turn it into the UI shape." Pure functions only — no Supabase, no `next/headers` — so BOTH server code and the client `SearchDialog` can import it.

**Files:**
- Create: `lib/menu-map.js`

**Interfaces:**
- Produces:
  - `MENU_SELECT` (string) — the Supabase `.select(...)` column list, including the joined category name.
  - `mapMenuRow(row)` → `{ id: string, name: string, description: string, price: number, rating: number, featured: boolean, image: string, category: string }`

- [ ] **Step 1: Create the mapper file**

```js
// lib/menu-map.js
// Pure helpers shared by server fetchers and the client-side search.
// No Supabase import here, so this is safe in both server and client code.

// Columns to select from `menu_items`, plus the joined category name.
export const MENU_SELECT =
  "id, name, description, price, image_url, rating, is_featured, is_available, categories(name)";

// Convert one database row into the shape the UI components already expect.
export function mapMenuRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    rating: Number(row.rating ?? 0),
    featured: Boolean(row.is_featured),
    image: row.image_url ?? "",
    category: row.categories?.name ?? "",
  };
}
```

- [ ] **Step 2: Verify it parses (no syntax errors)**

Run: `node --check lib/menu-map.js` (use full node path if needed: `"C:\Program Files\nodejs\node.exe" --check lib/menu-map.js`)
Expected: no output, exit code 0 (a syntax error would print here).

- [ ] **Step 3: Commit**

```bash
git add lib/menu-map.js
git commit -m "feat: add pure menu row mapper"
```

---

### Task 2: Server data-access layer (`lib/menu-data.js`)

Server-only functions that fetch from Supabase and return UI-ready data. Used by Server Components (menu page, home page).

**Files:**
- Create: `lib/menu-data.js`

**Interfaces:**
- Consumes: `MENU_SELECT`, `mapMenuRow` from `lib/menu-map.js`; `createClient` from `lib/supabase/server.js`.
- Produces:
  - `async getMenuItems()` → `Array<mappedItem>` (only `is_available = true`, ordered by `created_at`).
  - `async getCategories()` → `Array<string>` (category names ordered by `sort_order`).

- [ ] **Step 1: Create the data-access file**

```js
// lib/menu-data.js
// Server-only: fetches the menu from Supabase and returns UI-ready objects.
import { createClient } from "@/lib/supabase/server";
import { MENU_SELECT, mapMenuRow } from "@/lib/menu-map";

export async function getMenuItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_SELECT)
    .eq("is_available", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMenuItems error:", error.message);
    return [];
  }
  return (data ?? []).map(mapMenuRow);
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories error:", error.message);
    return [];
  }
  return (data ?? []).map((c) => c.name);
}
```

- [ ] **Step 2: Verify it parses**

Run: `node --check lib/menu-data.js`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add lib/menu-data.js
git commit -m "feat: add server-side menu data access"
```

> This task has no standalone runtime test because it depends on Next's server runtime (`next/headers`). It is exercised end-to-end in Task 3 when the menu page renders real data.

---

### Task 3: Menu page reads from the database (`app/menu/page.js`)

Convert the menu page from a Client Component into an `async` Server Component that fetches from Supabase. The `Tabs` UI components are client components from `components/ui/tabs` and work fine when rendered by a Server Component (we only pass them serializable data).

**Files:**
- Modify: `app/menu/page.js` (full rewrite of the file)

**Interfaces:**
- Consumes: `getMenuItems`, `getCategories` from `lib/menu-data.js`; `MenuCard`; `Tabs/TabsList/TabsTrigger/TabsContent`.

- [ ] **Step 1: Replace the whole file**

```jsx
// The MENU page (/menu). Items now come from Supabase, grouped into tabs.
import { getMenuItems, getCategories } from "@/lib/menu-data";
import MenuCard from "@/components/MenuCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function MenuPage() {
  const [items, categories] = await Promise.all([
    getMenuItems(),
    getCategories(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        The full list
      </p>
      <h1 className="font-display text-4xl sm:text-5xl">Our Menu</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Choose a course and add what you like — your order builds in the cart.
      </p>

      {categories.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          Menu is being updated — please check back shortly.
        </p>
      ) : (
        <Tabs defaultValue={categories[0]} className="mt-10">
          <TabsList className="mb-8 bg-secondary">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="uppercase tracking-[0.12em] data-[state=active]:text-olive"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => {
            const inCategory = items.filter((i) => i.category === category);
            return (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {inCategory.map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Make sure the dev server is running (restarted since env was added)**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/menu`
Expected: `200`

- [ ] **Step 3: Verify real DB data renders on the page**

Run: `curl -s http://localhost:3000/menu | grep -c "Classic Beef Burger"`
Expected: `1` (or more) — the burger name came from Supabase into the HTML.

Also check a price made it through:
Run: `curl -s http://localhost:3000/menu | grep -c "6.99"`
Expected: `1` or more.

- [ ] **Step 4: Commit**

```bash
git add app/menu/page.js
git commit -m "feat: menu page reads from Supabase"
```

---

### Task 4: Home page "Popular picks" + hero thumbnails from the database (`app/page.js`)

The home page is already a Server Component. Swap the static import for the DB fetch and compute featured items inside the component.

**Files:**
- Modify: `app/page.js`

**Interfaces:**
- Consumes: `getMenuItems` from `lib/menu-data.js`.

- [ ] **Step 1: Change the imports at the top of the file**

Replace these lines:

```js
import { MENU_ITEMS } from "@/lib/menu";
import MenuCard from "@/components/MenuCard";

const thumbs = MENU_ITEMS.filter((i) => i.featured).slice(0, 3);
const picks = MENU_ITEMS.filter((i) => i.featured);
```

with:

```js
import { getMenuItems } from "@/lib/menu-data";
import MenuCard from "@/components/MenuCard";
```

- [ ] **Step 2: Make the component async and compute featured items inside it**

Replace this line:

```js
export default function Home() {
  return (
```

with:

```js
export default async function Home() {
  const items = await getMenuItems();
  const featured = items.filter((i) => i.featured);
  const thumbs = featured.slice(0, 3);
  const picks = featured;

  return (
```

(The rest of the file is unchanged — it already uses `thumbs` and `picks`.)

- [ ] **Step 3: Verify the home page still renders and shows DB items**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`

Run: `curl -s http://localhost:3000/ | grep -c "Order Now"`
Expected: `1` or more (the featured thumbnails rendered).

- [ ] **Step 4: Commit**

```bash
git add app/page.js
git commit -m "feat: home featured picks read from Supabase"
```

---

### Task 5: Search reads from the database (`components/SearchDialog.jsx`)

`SearchDialog` is a Client Component (it lives in the client `Navbar`), so it fetches with the **browser** Supabase client when it first mounts, then filters in memory exactly as before.

**Files:**
- Modify: `components/SearchDialog.jsx`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/client.js`; `MENU_SELECT`, `mapMenuRow` from `lib/menu-map.js`.

- [ ] **Step 1: Replace the imports and the data source**

Replace this import line:

```js
import { MENU_ITEMS } from "@/lib/menu";
```

with:

```js
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MENU_SELECT, mapMenuRow } from "@/lib/menu-map";
```

(If `useState` is already imported at the top from `"react"`, merge them into the single line above rather than importing `react` twice.)

- [ ] **Step 2: Load items from Supabase on mount**

Immediately after the existing `const [query, setQuery] = useState("");` line, add:

```js
  const [items, setItems] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("menu_items")
      .select(MENU_SELECT)
      .eq("is_available", true)
      .then(({ data, error }) => {
        if (error) {
          console.error("Search load error:", error.message);
          return;
        }
        setItems((data ?? []).map(mapMenuRow));
      });
  }, []);
```

- [ ] **Step 3: Point the filter at `items` instead of `MENU_ITEMS`**

Change this line:

```js
  const results = q
    ? MENU_ITEMS.filter(
```

to:

```js
  const results = q
    ? items.filter(
```

and change the `: MENU_ITEMS;` fallback (the no-query case) to:

```js
    : items;
```

- [ ] **Step 4: Verify the app still compiles and search has no static dependency**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200` (a compile error would make this fail).

Run: `grep -c "lib/menu\"" components/SearchDialog.jsx`
Expected: `0` (no more static menu import in search).

Manual check (browser): open http://localhost:3000, click the search icon, type "burger" → the Classic Beef Burger appears. These results are now coming from Supabase.

- [ ] **Step 5: Commit**

```bash
git add components/SearchDialog.jsx
git commit -m "feat: menu search reads from Supabase"
```

---

### Task 6: Remove the duplicate seed file (cleanup)

There are two identical seed files. Keep the one under `migrations/` (it runs in order with the schema) and remove the loose duplicate.

**Files:**
- Delete: `supabase/seed.sql` (duplicate of `supabase/migrations/0002_seed_menu.sql`)

- [ ] **Step 1: Confirm they are duplicates before deleting**

Run: `diff <(grep -o "'[A-Za-z ]*'" supabase/seed.sql | sort) <(grep -o "'[A-Za-z ]*'" supabase/migrations/0002_seed_menu.sql | sort)`
Expected: no differences in the item names (both seed the same 13 items). If they differ, STOP and review before deleting.

- [ ] **Step 2: Delete the duplicate**

```bash
rm supabase/seed.sql
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove duplicate menu seed file"
```

---

## Verification (whole phase)

After all tasks, confirm the site is fully DB-driven:

- [ ] `/menu`, `/`, and search all show the 13 items with correct prices.
- [ ] Proof it's the database, not the static file: in Supabase → Table Editor → `menu_items`, change one item's price (e.g. set Classic Beef Burger to `9.99`), then reload `/menu` in the browser. The new price shows **without any code change**. (Change it back afterwards.)
- [ ] `git grep -l "lib/menu\"" app components` returns nothing (no page imports the static menu anymore). `lib/menu.js` itself remains on disk as a fallback.

## What this phase intentionally does NOT do (next phases)

- Persisting orders after Stripe payment (Phase 2).
- User accounts / login / order history (Phase 3).
- Admin menu management + image upload (Phase 4).
- Hardening the Stripe route to recompute prices from the DB — currently `app/api/checkout/route.js` trusts browser prices (tracked as a known risk in the PRD). Best folded into Phase 2.
