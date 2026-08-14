import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Helper so TypeScript can infer the exact Drizzle return type
// (including schema-specific query builder types).
function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

type DB = ReturnType<typeof createDb>;

// During `next build` without DATABASE_URL (Docker CI), `db` is typed
// correctly but NEVER actually accessed — all DB-querying pages are
// marked `dynamic = "force-dynamic"` and skip static generation.
const connectionString = process.env.DATABASE_URL;
export const db: DB = connectionString
  ? createDb(connectionString)
  : (null as unknown as DB);

export type { DB };
export * from "./schema";
