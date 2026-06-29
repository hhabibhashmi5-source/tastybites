# Project layout convention

This repo is split into two top-level folders. When creating or moving a file,
put it in the correct one:

- **`frontend/`** — the Next.js app. UI, pages, components, styles, AND the
  server-side code that Next.js requires to live *inside* the app:
  - route handlers (`app/api/**`)
  - server actions (`"use server"` files)
  - server/client Supabase clients and any lib imported via `@/...`
  These cannot move out — Next.js resolves them by their in-app path, so moving
  them breaks the build.

- **`backend/`** — standalone backend assets that are NOT part of the Next.js
  runtime and run on their own:
  - database schema, SQL migrations, and seed data
  - DB/admin scripts you invoke directly (e.g. `db-migrate.js`)
  - any separate services, workers, queues, or infra

## Rule of thumb

If a file is imported by Next.js code (a page, component, route handler, or
server action), it belongs in **`frontend/`**. If it runs on its own (a script
you execute, SQL, infra config), it belongs in **`backend/`**.

When in doubt about a backend file that the Next app also needs, keep it in
`frontend/` (co-located server code) rather than breaking an import.
