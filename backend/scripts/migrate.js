// Applies pending SQL migrations from backend/migrations/ to the database.
// Run with:  npm run migrate
//
// How it works:
//   - Every .sql file in migrations/ is a "migration", applied in name order.
//   - A ledger table (public.schema_migrations) records which files already ran.
//   - Only files NOT in the ledger are executed, so it's safe to run repeatedly.
//   - Each file runs inside a transaction: if it errors, it rolls back fully.
//
// NOTE: this ledger is SHARED with ../frontend's `npm run db:migrate`. Give
// backend migration files names that won't collide with the frontend's
// (the frontend uses 0001..0005). Prefix backend ones, e.g. "b001_*.sql".

const fs = require("fs");
const path = require("path");
const { connect } = require("./db");

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

async function main() {
  const client = await connect();
  console.log("Connected.\n");

  // Ensure the ledger exists (created already if the frontend ran first).
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

  if (files.length === 0) {
    console.log("No migration files in migrations/ yet. Nothing to do.");
    await client.end();
    return;
  }

  const { rows } = await client.query(
    "select version from public.schema_migrations"
  );
  const applied = new Set(rows.map((r) => r.version));

  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip    ${file} (already applied)`);
      continue;
    }
    ranAny = true;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`apply   ${file} ... `);
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
      await client.end();
      throw new Error(`${file}: ${err.message}`);
    }
  }

  if (!ranAny) console.log("No pending migrations.");
  await client.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
