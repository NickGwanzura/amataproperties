import { eq } from "drizzle-orm";
import { db, canUseDatabase } from "@/lib/db";
import { accounts, users } from "@/lib/db/schema";
import { findDemoUser, type AuthUser } from "@/lib/auth-token";
import { verifyPassword } from "@/lib/password";

export type { AuthUser, Session, UserRole } from "@/lib/auth-token";

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (canUseDatabase()) {
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        password: accounts.password,
      })
      .from(users)
      .leftJoin(accounts, eq(accounts.userId, users.id))
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (row && verifyPassword(password, row.password)) {
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
      };
    }

    // Database is available — never fall through to demo accounts
    return null;
  }

  // No database configured: allow demo accounts for local development only
  if (process.env.NODE_ENV !== "production") {
    const demoUser = findDemoUser(normalizedEmail);
    if (demoUser && password === "password123") {
      return demoUser;
    }
  }

  return null;
}
