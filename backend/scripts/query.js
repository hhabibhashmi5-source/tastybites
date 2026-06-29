// Run an ad-hoc SQL query against the database and print the result as a table.
//
// Usage:
//   npm run query -- "select * from categories"
//   npm run query -- "select name, price from menu_items limit 5"
//
// The `--` is required so npm passes the SQL through to this script.
// Tip: use this for SELECTs to inspect data. For schema changes, write a
// migration file instead so the change is tracked and repeatable.

const { connect } = require("./db");

async function main() {
  const sql = process.argv.slice(2).join(" ").trim();
  if (!sql) {
    console.error('Provide a query, e.g.:  npm run query -- "select * from categories"');
    process.exit(1);
  }

  const client = await connect();
  try {
    const result = await client.query(sql);
    if (Array.isArray(result.rows) && result.rows.length > 0) {
      console.table(result.rows);
      console.log(`\n${result.rowCount} row(s).`);
    } else if (typeof result.rowCount === "number") {
      console.log(`OK. ${result.rowCount} row(s) affected.`);
    } else {
      console.log("OK.");
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nQuery failed:", err.message);
  process.exit(1);
});
