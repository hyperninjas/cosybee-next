// Applies the Prisma schema to a remote libSQL/Turso database.
//
// `prisma db push` targets the local SQLite file; for the hosted DB we
// generate the CREATE SQL from the schema and run it over the libSQL
// connection. Idempotent (IF NOT EXISTS), so it's safe to re-run for a
// fresh deploy. Usage:
//   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… node scripts/deploy-schema.mjs
import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const raw = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  { encoding: "utf8" },
);

// Make re-runs safe.
const sql = raw
  .replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ")
  .replace(/CREATE UNIQUE INDEX /g, "CREATE UNIQUE INDEX IF NOT EXISTS ")
  .replace(/CREATE INDEX /g, "CREATE INDEX IF NOT EXISTS ");

const statements = sql
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

const client = createClient({ url, authToken });
for (const stmt of statements) {
  await client.execute(stmt);
}
console.log(`Applied ${statements.length} statements to ${url}`);
client.close();
