// Shared database connection helper.
// Reads credentials from backend/.env and returns a connected pg Client.
//
// Every script in this folder uses this so the connection logic lives in one
// place. If the connection settings ever change, you only edit them here.

const os = require("os");
const path = require("path");
const { Client } = require("pg");

// Secrets live OUTSIDE the repo in a user-only locked folder (not in version
// control, not readable by other accounts). Override the location with the
// HAROON_SECRETS_DIR env var if you keep it somewhere else.
const SECRETS_DIR =
  process.env.HAROON_SECRETS_DIR || path.join(os.homedir(), "haroon-secrets");

// Load the backend env file from the vault (formerly backend/.env).
require("dotenv").config({ path: path.join(SECRETS_DIR, "backend.env") });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} in backend/.env. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

// Create a new connected client. Caller is responsible for client.end().
async function connect() {
  const client = new Client({
    host: required("SUPABASE_DB_HOST"),
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    user: process.env.SUPABASE_DB_USER || "postgres",
    database: process.env.SUPABASE_DB_NAME || "postgres",
    password: required("SUPABASE_DB_PASSWORD"),
    // Supabase requires SSL; this accepts their managed certificate.
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

module.exports = { connect };
