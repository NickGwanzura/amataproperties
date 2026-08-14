import { and, count, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { stands, sales, standHistory, agentProfiles, type NewStand } from "@/lib/db/schema";

export async function getAgentOptions() {
  const rows = await db.query.agentProfiles.findMany({
    where: eq(agentProfiles.active, true),
    with: { user: true },
  });
  return rows.map((a) => ({ id: a.id, name: a.user?.name ?? "—", email: a.user?.email ?? "" }));
}

export async function getStandsByDevelopment(developmentId: string) {
  return db.query.stands.findMany({
    where: and(
      eq(stands.developmentId, developmentId),
      isNull(stands.archivedAt),
      isNull(stands.deletedAt),
    ),
    orderBy: (s, { asc }) => [asc(s.standNumber)],
  });
}

export async function getAvailableStands(developmentId?: string) {
  return db.query.stands.findMany({
    where: developmentId
      ? and(
          eq(stands.developmentId, developmentId),
          eq(stands.status, "AVAILABLE"),
          isNull(stands.archivedAt),
          isNull(stands.deletedAt),
        )
      : and(
          eq(stands.status, "AVAILABLE"),
          isNull(stands.archivedAt),
          isNull(stands.deletedAt),
        ),
    with: { development: true },
    orderBy: (s, { asc }) => [asc(s.standNumber)],
  });
}

export async function getStandById(id: string) {
  return db.query.stands.findFirst({
    where: eq(stands.id, id),
    with: { development: true, reservations: { with: { client: true, agent: true } }, sale: { with: { client: true, agent: true } } },
  });
}

export async function updateStandStatus(
  id: string,
  status: "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED",
) {
  const [updated] = await db
    .update(stands)
    .set({ status, updatedAt: new Date() })
    .where(eq(stands.id, id))
    .returning();
  return updated;
}

export async function createStand(data: NewStand) {
  const [created] = await db.insert(stands).values(data).returning();
  return created;
}

export async function updateStand(id: string, data: Partial<NewStand>) {
  const [updated] = await db
    .update(stands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(stands.id, id))
    .returning();
  return updated;
}

/** Per-stand event timeline (status changes, archive/restore, reserve/release, transfers) — distinct from the generic auditLogs global trail. */
export async function getStandHistory(standId: string) {
  return db.query.standHistory.findMany({
    where: eq(standHistory.standId, standId),
    with: { user: true },
    orderBy: (h, { desc }) => [desc(h.createdAt)],
  });
}

/**
 * Shared stand-level aggregates used by both the development KPI cards
 * (Phase 1's getDevelopmentKpis) and any stand-management dashboards —
 * kept in one place so the two never compute this differently.
 */
export async function computeStandAggregates(developmentId: string) {
  const [standTotals] = await db
    .select({
      totalValue: sql<string>`coalesce(sum(${stands.price}), 0)`,
      totalCount: count(stands.id),
      soldCount: sql<number>`sum(case when ${stands.status} = 'SOLD' then 1 else 0 end)`,
      reservedValue: sql<string>`coalesce(sum(case when ${stands.status} = 'RESERVED' then ${stands.price} else 0 end), 0)`,
    })
    .from(stands)
    .where(and(
      eq(stands.developmentId, developmentId),
      isNull(stands.archivedAt),
      isNull(stands.deletedAt),
    ));

  const [salesTotals] = await db
    .select({
      purchasePriceSum: sql<string>`coalesce(sum(${sales.purchasePrice}), 0)`,
      collectedSum: sql<string>`coalesce(sum(${sales.purchasePrice} - ${sales.outstandingBalance}), 0)`,
      outstandingSum: sql<string>`coalesce(sum(${sales.outstandingBalance}), 0)`,
    })
    .from(sales)
    .where(and(eq(sales.developmentId, developmentId), inArray(sales.status, ["ACTIVE", "PAID_OFF"])));

  const totalCount = Number(standTotals?.totalCount ?? 0);
  const soldCount = Number(standTotals?.soldCount ?? 0);
  const purchasePriceSum = parseFloat(salesTotals?.purchasePriceSum ?? "0");
  const collectedSum = parseFloat(salesTotals?.collectedSum ?? "0");

  return {
    totalValue: parseFloat(standTotals?.totalValue ?? "0"),
    occupancyPct: totalCount > 0 ? (soldCount / totalCount) * 100 : 0,
    salesProgressPct: purchasePriceSum > 0 ? (collectedSum / purchasePriceSum) * 100 : 0,
    outstandingInstallments: parseFloat(salesTotals?.outstandingSum ?? "0"),
    reservedValue: parseFloat(standTotals?.reservedValue ?? "0"),
  };
}

export type StandFilterOptions = {
  developmentId?: string;
  status?: "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED";
  phase?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  includeArchived?: boolean;
  includeDeleted?: boolean;
};

/** Filtered stand register — backs the Stand Management list view's filter bar. */
export async function getStandsFiltered(opts: StandFilterOptions = {}) {
  const conditions = [];
  if (opts.developmentId) conditions.push(eq(stands.developmentId, opts.developmentId));
  if (opts.status) conditions.push(eq(stands.status, opts.status));
  if (opts.phase) conditions.push(eq(stands.phase, opts.phase));
  if (opts.priceMin !== undefined) conditions.push(gte(sql`${stands.price}::numeric`, opts.priceMin));
  if (opts.priceMax !== undefined) conditions.push(lte(sql`${stands.price}::numeric`, opts.priceMax));
  if (opts.sizeMin !== undefined) conditions.push(gte(stands.sizeSqm, opts.sizeMin));
  if (opts.sizeMax !== undefined) conditions.push(lte(stands.sizeSqm, opts.sizeMax));
  if (opts.search) {
    const term = `%${opts.search.toLowerCase()}%`;
    conditions.push(or(sql`lower(${stands.standNumber}) like ${term}`, sql`lower(coalesce(${stands.notes}, '')) like ${term}`));
  }
  if (!opts.includeDeleted) conditions.push(isNull(stands.deletedAt));
  if (!opts.includeArchived) conditions.push(isNull(stands.archivedAt));

  return db.query.stands.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { development: true },
    orderBy: (s, { asc }) => [asc(s.standNumber)],
  });
}
