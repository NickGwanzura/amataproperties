import postgres from "postgres";
import { readFile } from "node:fs/promises";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("DATABASE_URL is not configured; skipping database bootstrap.");
  process.exit(0);
}

const sql = postgres(connectionString, { max: 1 });

try {
  const [{ name }] = await sql`select to_regclass('public.developments') as name`;
  if (name) {
    console.log("Database schema already exists.");
    process.exit(0);
  }

  const migration = await readFile(new URL("../drizzle/0000_initial.sql", import.meta.url), "utf8");
  const statements = migration
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  await sql.begin(async (transaction) => {
    for (const statement of statements) await transaction.unsafe(statement);
  });

  console.log(`Database schema initialized (${statements.length} statements).`);
} finally {
  await sql.end({ timeout: 5 });
}
