import { db } from "@/lib/db/index";
import { auditLogs } from "@/lib/db/schema";

export async function auditLog(input: {
  userId?: string;
  action: string;
  module: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}) {
  // Auto-populate userId from the session if not explicitly provided.
  // We lazily import to avoid circular deps and because the session reader
  // depends on next/headers (server-only).
  let userId = input.userId;
  if (!userId) {
    try {
      const { getSessionUser } = await import("@/lib/session");
      const sessionUser = await getSessionUser();
      userId = sessionUser?.id;
    } catch {
      // Not in a request context (e.g. cron job, build time) — that's fine.
    }
  }

  await db.insert(auditLogs).values({
    userId,
    action: input.action,
    module: input.module,
    previousValue:
      input.previousValue !== undefined
        ? JSON.parse(JSON.stringify(input.previousValue))
        : undefined,
    newValue:
      input.newValue !== undefined
        ? JSON.parse(JSON.stringify(input.newValue))
        : undefined,
    ipAddress: input.ipAddress,
  });
}
