import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { hashPassword } from "../password";
import * as schema from "./schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

async function main() {
  console.log("Seeding database…");

  // ── Wipe all data in dependency order ────────────────────────────────────
  await db.delete(schema.auditLogs);
  await db.delete(schema.notifications);
  await db.delete(schema.documents);
  await db.delete(schema.commissions);
  await db.delete(schema.payments);
  await db.delete(schema.installments);
  await db.delete(schema.installmentPlans);
  await db.delete(schema.sales);
  await db.delete(schema.reservations);
  await db.delete(schema.leads);
  await db.delete(schema.stands);
  await db.delete(schema.developments);
  await db.delete(schema.clients);
  await db.delete(schema.agentProfiles);
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.verifications);
  await db.delete(schema.users);

  // ── System Admin ──────────────────────────────────────────────────────────
  console.log("Creating system admin…");
  const hashed = await hashPassword("Amata@2026!");

  const [sysadmin] = await db
    .insert(schema.users)
    .values({
      name: "Nicholas Gwanzura",
      email: "nicholas.gwanzura@outlook.com",
      emailVerified: true,
      role: "SYSTEM_ADMIN",
    })
    .returning();

  await db.insert(schema.accounts).values({
    userId: sysadmin.id,
    accountId: "nicholas.gwanzura@outlook.com",
    providerId: "email",
    password: hashed,
  });

  console.log("\nSeed complete.");
  console.log("─────────────────────────────────────────");
  console.log("  Login: nicholas.gwanzura@outlook.com");
  console.log("  Password: Amata@2026!");
  console.log("  Role: SYSTEM_ADMIN");
  console.log("─────────────────────────────────────────");
  console.log("Change this password after first login.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
