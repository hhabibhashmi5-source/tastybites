// Applies pending SQL migrations to the Supabase Postgres database and verifies
// the expected tables exist. Run it whenever you add a migration so a feature is
// never silently broken by an un-applied migration (the bug that made "Leave a
// review" fail):
//
//   npm run db:migrate
//
// How it stays safe to run repeatedly: a ledger table (public.schema_migrations)
// records which migration files have already run, and only *unrecorded* files
// are executed. The migrations themselves are NOT all idempotent (e.g. 0001
// creates policies that 0002 recreates), so we must never re-run an applied one.
//
// First run (ledger doesn't exist yet) on a database that already has the core
// tables is treated as a BASELINE: existing migration files are recorded as
// applied without re-executing them, adopting the current schema.
//
// Connection: host is derived from NEXT_PUBLIC_SUPABASE_URL in .env.local; the
// password comes from SUPABASE_DB_PASSWORD (env) or the project password file.

const os = require("os");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ROOT = path.join(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
// The DB password now lives in a user-only locked vault outside the repo.
// Override the location with HAROON_SECRETS_DIR if you keep it elsewhere.
const SECRETS_DIR =
  process.env.HAROON_SECRETS_DIR || path.join(os.homedir(), "haroon-secrets");
const PASSWORD_FILE = path.join(SECRETS_DIR, "supabase-db-password.txt");

// Tables every feature depends on — checked after migrating.
const EXPECTED_TABLES = [
  "profiles",
  "categories",
  "menu_items",
  "orders",
  "order_items",
  "contact_messages",
  "reviews",
];

// Minimal .env.local reader (no dotenv dependency).
function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const line = env.split(/\r?\n/).find((l) => l.trim().startsWith(`${name}=`));
    return line ? line.slice(line.indexOf("=") + 1).trim() : undefined;
  } catch {
    return undefined;
  }
}

function dbHostFromUrl(url) {
  // https://<ref>.supabase.co  ->  db.<ref>.supabase.co
  const ref = new URL(url).hostname.split(".")[0];
  return `db.${ref}.supabase.co`;
}

function getPassword() {
  if (process.env.SUPABASE_DB_PASSWORD) return process.env.SUPABASE_DB_PASSWORD;
  return fs.readFileSync(PASSWORD_FILE, "utf8").trim();
}

async function tablesPresent(client) {
  const { rows } = await client.query(
    `select table_name from information_schema.tables where table_schema = 'public'`
  );
  return new Set(rows.map((r) => r.table_name));
}

async function main() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");

  const client = new Client({
    host: dbHostFromUrl(supabaseUrl),
    port: 5432,
    user: "postgres",
    password: getPassword(),
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Connected to ${dbHostFromUrl(supabaseUrl)}\n`);

  // Did the ledger already exist before this run?
  const ledgerExisted = (await tablesPresent(client)).has("schema_migrations");

  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows: appliedRows } = await client.query(
    "select version from public.schema_migrations"
  );
  const applied = new Set(appliedRows.map((r) => r.version));

  // BASELINE: first ever run, and the core schema is already in place → record
  // existing migrations as applied without executing them.
  const present = await tablesPresent(client);
  const coreInPlace = EXPECTED_TABLES.every((t) => present.has(t));
  if (!ledgerExisted && applied.size === 0 && coreInPlace) {
    console.log("Baseline: schema already present — recording migrations as applied.");
    for (const file of files) {
      await client.query(
        "insert into public.schema_migrations(version) values ($1) on conflict do nothing",
        [file]
      );
      console.log(`  baselined ${file}`);
      applied.add(file);
    }
  }

  // Apply any migration files not yet recorded.
  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) continue;
    ranAny = true;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations(version) values ($1)",
        [file]
      );
      await client.query("commit");
      console.log("ok");
    } catch (err) {
      await client.query("rollback");
      console.log("FAILED");
      throw new Error(`${file}: ${err.message}`);
    }
  }
  if (!ranAny) console.log("No pending migrations.");

  // Verify every expected table is present.
  console.log("\nVerifying tables:");
  const finalPresent = await tablesPresent(client);
  let missing = 0;
  for (const t of EXPECTED_TABLES) {
    const ok = finalPresent.has(t);
    if (!ok) missing++;
    console.log(`  ${ok ? "OK     " : "MISSING"}  ${t}`);
  }

  await client.end();

  if (missing > 0) {
    throw new Error(`${missing} expected table(s) missing after migration.`);
  }
  console.log("\nAll migrations applied and all tables present.");
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
