import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { hashPassword } from "../password";
import * as schema from "./schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

const TEST_PASSWORD = "Test@2026!";

const users = [
  { name: "Test CEO",        email: "ceo@test.amata",        role: "CEO"           as const },
  { name: "Test Admin",      email: "admin@test.amata",      role: "ADMINISTRATOR" as const },
  { name: "Test Agent",      email: "agent@test.amata",      role: "AGENT"         as const },
  { name: "Test Accounts",   email: "accounts@test.amata",   role: "ACCOUNTS"      as const },
  { name: "Test Client",     email: "client@test.amata",     role: "CLIENT"        as const },
];

async function main() {
  const hashed = await hashPassword(TEST_PASSWORD);

  for (const u of users) {
    const existing = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.email, u.email),
    });
    if (existing) {
      console.log(`  ⚠  ${u.email} already exists — skipping`);
      continue;
    }

    const [user] = await db
      .insert(schema.users)
      .values({ name: u.name, email: u.email, emailVerified: true, role: u.role })
      .returning();

    await db.insert(schema.accounts).values({
      userId: user.id,
      accountId: u.email,
      providerId: "email",
      password: hashed,
    });

    if (u.role === "AGENT") {
      await db.insert(schema.agentProfiles).values({
        userId: user.id,
        commissionRate: "10",
        active: true,
      });
    }

    if (u.role === "CLIENT") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.insert(schema.clients) as any).values({
        userId: user.id,
        name: u.name,
        email: u.email,
        phone: "+263770000002",
        nationalId: "00-000000-T-00",
        address: "123 Test St, Harare",
      });
    }

    console.log(`  ✓  ${u.role.padEnd(14)} ${u.email}`);
  }

  console.log("\n─────────────────────────────────────────");
  console.log("  Password for all test accounts:");
  console.log(`    ${TEST_PASSWORD}`);
  console.log("─────────────────────────────────────────");
  console.log("  CEO       → ceo@test.amata");
  console.log("  Admin     → admin@test.amata");
  console.log("  Agent     → agent@test.amata");
  console.log("  Accounts  → accounts@test.amata");
  console.log("  Client    → client@test.amata");
  console.log("─────────────────────────────────────────");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
