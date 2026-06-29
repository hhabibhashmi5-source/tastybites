// Quick health check: connect to the database and report basic info.
// Run with:  npm run ping

const { connect } = require("./db");

async function main() {
  const client = await connect();
  console.log("Connected!\n");

  const { rows: ver } = await client.query("select version()");
  console.log("Server:", ver[0].version.split(",")[0]);

  const { rows: tables } = await client.query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
      order by table_name`
  );
  console.log(`\nTables in public schema (${tables.length}):`);
  for (const t of tables) console.log("  -", t.table_name);

  await client.end();
}

main().catch((err) => {
  console.error("\nConnection failed:", err.message);
  process.exit(1);
});
