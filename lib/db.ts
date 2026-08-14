// Re-export the Drizzle client and schema from the db module
export { db } from "@/lib/db/index";
export type { DB } from "@/lib/db/index";

/** Check whether a database connection is available */
export function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

