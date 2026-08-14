import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to set shared test passwords in production.");
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl || !/localhost|127\.0\.0\.1|test|dev|staging/i.test(databaseUrl)) {
    throw new Error("Refusing to set shared test passwords without an explicit local, test, dev, or staging database URL.");
  }

  const password = "password123";
  const hashed = await hashPassword(password);

  // Find the accounts user, agent user, and client user
  const accountsUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "accounts@amataproperties.com"),
  });
  const agentUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "tariro@amataproperties.com"),
  });
  const clientUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "nyasha@example.com"),
  });
  const clientUser2 = await db.query.users.findFirst({
    where: eq(schema.users.email, "kundai@example.com"),
  });
  const adminUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "admin@amataproperties.com"),
  });
  const ceoUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "ceo@amataproperties.com"),
  });

  // Delete existing email accounts for these users to avoid conflicts
  const emails = ["accounts@amataproperties.com", "tariro@amataproperties.com", "nyasha@example.com", "kundai@example.com", "admin@amataproperties.com", "ceo@amataproperties.com"];
  for (const email of emails) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    if (user) {
      await db.delete(schema.accounts).where(eq(schema.accounts.userId, user.id));
    }
  }

  // Create account records with passwords
  const accounts = [
    { userId: accountsUser!.id, email: "accounts@amataproperties.com" },
    { userId: agentUser!.id, email: "tariro@amataproperties.com" },
    { userId: clientUser!.id, email: "nyasha@example.com" },
    { userId: clientUser2!.id, email: "kundai@example.com" },
    { userId: adminUser!.id, email: "admin@amataproperties.com" },
    { userId: ceoUser!.id, email: "ceo@amataproperties.com" },
  ];

  await db.insert(schema.accounts).values(
    accounts.map((a) => ({
      userId: a.userId,
      accountId: a.email,
      providerId: "email",
      password: hashed,
    }))
  );

  console.log("Passwords set for all test users. Password: password123");

  // Print login info
  console.log("\n=== Login Credentials ===");
  console.log("accounts@amataproperties.com / password123 → Accounts dashboard");
  console.log("tariro@amataproperties.com / password123 → Agent dashboard");
  console.log("nyasha@example.com / password123 → Client dashboard");
  console.log("kundai@example.com / password123 → Client dashboard");
  console.log("admin@amataproperties.com / password123 → Admin dashboard");
  console.log("ceo@amataproperties.com / password123 → CEO dashboard");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
