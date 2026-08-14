import { and, desc, gte, lte, sql, eq, count } from "drizzle-orm";
import { db, canUseDatabase } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import type { SQL } from "drizzle-orm";

export type AuditLogFilters = {
  limit?: number;
  offset?: number;
  module?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AuditLogCountResult = { count: number };

/**
 * Fetch audit log entries with optional filters, pagination, and search.
 */
export async function getAuditLogsPaginated(filters: AuditLogFilters = {}) {
  if (!canUseDatabase()) return [];

  const {
    limit = 100,
    offset = 0,
    module,
    search,
    dateFrom,
    dateTo,
  } = filters;

  const conditions: SQL<unknown>[] = [];

  if (module && module !== "ALL") {
    conditions.push(eq(auditLogs.module, module));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      sql`(${auditLogs.action} ilike ${term} or ${auditLogs.module} ilike ${term})`,
    );
  }

  if (dateFrom) {
    conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    // Add one day so the filter is inclusive of the selected date
    const end = new Date(dateTo);
    end.setDate(end.getDate() + 1);
    conditions.push(lte(auditLogs.createdAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.query.auditLogs.findMany({
    where,
    with: { user: { columns: { id: true, name: true, email: true } } },
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit,
    offset,
  });
}

/**
 * Get total count of audit log entries matching the given filters.
 * Used for UI pagination.
 */
export async function getAuditLogsCount(filters: AuditLogFilters = {}): Promise<number> {
  if (!canUseDatabase()) return 0;

  const { module, search, dateFrom, dateTo } = filters;
  const conditions: SQL<unknown>[] = [];

  if (module && module !== "ALL") {
    conditions.push(eq(auditLogs.module, module));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      sql`(${auditLogs.action} ilike ${term} or ${auditLogs.module} ilike ${term})`,
    );
  }

  if (dateFrom) {
    conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    const end = new Date(dateTo);
    end.setDate(end.getDate() + 1);
    conditions.push(lte(auditLogs.createdAt, end));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [result] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(where);

  return result?.count ?? 0;
}

// -- Keep the original functions for backward compatibility --

export async function getAuditLogs(limit = 100) {
  if (!canUseDatabase()) return [];
  return db.query.auditLogs.findMany({
    with: { user: true },
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit,
  });
}

export async function getAuditLogsByModule(module: string, limit = 50) {
  if (!canUseDatabase()) return [];
  return db.query.auditLogs.findMany({
    where: eq(auditLogs.module, module),
    with: { user: true },
    orderBy: [desc(auditLogs.createdAt)],
    limit,
  });
}

export async function getAuditLogsByUser(userId: string) {
  if (!canUseDatabase()) return [];
  return db.query.auditLogs.findMany({
    where: eq(auditLogs.userId, userId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });
}
