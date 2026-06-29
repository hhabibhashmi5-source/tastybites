# Backend — TastyBites database toolkit

This folder is **not** a server. It's a standalone toolkit for working with the
project's **Supabase** (Postgres) database directly: running migrations, seeding
data, and executing ad-hoc SQL.

The live app's backend is **Supabase + the Next.js API routes** in `../frontend`.
This folder just gives you direct, scriptable access to the same database.

## Setup (one time)

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the env template and fill in your real database credentials:
   ```
   copy .env.example .env
   ```
   (On Mac/Linux use `cp` instead of `copy`.)
3. Test the connection:
   ```
   npm run ping
   ```

## Commands

| Command           | What it does                                            |
| ----------------- | ------------------------------------------------------- |
| `npm run ping`    | Check that the database connection works                |
| `npm run migrate` | Apply any new `.sql` files in `migrations/` to the DB   |
| `npm run query`   | Run an ad-hoc SQL query (see `scripts/query.js`)        |

## Folders

- `migrations/` — numbered `.sql` files that change the database schema.
- `seeds/` — SQL to insert sample/starter data.
- `scripts/` — Node.js helper scripts.

> **Important:** the *same* database is also migrated from `../frontend` via
> `npm run db:migrate`. Both share the `public.schema_migrations` ledger. To
> avoid conflicts, decide on **one** source of truth for schema changes before
> adding migrations in both places.
