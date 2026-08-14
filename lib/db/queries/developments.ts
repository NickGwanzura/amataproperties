import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { developments, stands, type NewDevelopment } from "@/lib/db/schema";

const activeStands = {
  where: and(isNull(stands.archivedAt), isNull(stands.deletedAt)),
} as const;
import { computeStandAggregates } from "./stands";

export async function getAllDevelopments() {
  return db.query.developments.findMany({
    where: and(eq(developments.active, true), isNull(developments.archivedAt), isNull(developments.deletedAt)),
    with: { stands: activeStands },
    orderBy: (d, { asc }) => [asc(d.name)],
  });
}

/** Admin developments list: excludes soft-deleted by default; archived only shown when requested. */
export async function getAllDevelopmentsAdmin(opts?: { includeArchived?: boolean; includeDeleted?: boolean }) {
  const rows = await db.query.developments.findMany({
    with: { stands: activeStands },
    orderBy: (d, { asc }) => [asc(d.name)],
  });
  return rows.filter((d) => {
    if (!opts?.includeDeleted && d.deletedAt) return false;
    if (!opts?.includeArchived && d.archivedAt) return false;
    return true;
  });
}

export async function getArchivedDevelopments() {
  const rows = await db.query.developments.findMany({
    orderBy: (d, { asc }) => [asc(d.name)],
  });
  return rows.filter((d) => d.archivedAt && !d.deletedAt);
}

/** Per-development KPIs: total stand value, occupancy %, sales progress %, outstanding installments, reserved value. */
export async function getDevelopmentKpis(developmentId: string) {
  return computeStandAggregates(developmentId);
}

export async function getDevelopmentBySlug(slug: string) {
  return db.query.developments.findFirst({
    where: eq(developments.slug, slug),
    with: { stands: activeStands },
  });
}

export async function getAllDevelopmentsWithStandCounts() {
  return db.query.developments.findMany({
    with: { stands: activeStands },
    orderBy: (d, { asc }) => [asc(d.name)],
  });
}

export async function createDevelopment(data: NewDevelopment) {
  const [created] = await db.insert(developments).values(data).returning();
  return created;
}

export async function updateDevelopment(id: string, data: Partial<NewDevelopment>) {
  const [updated] = await db
    .update(developments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(developments.id, id))
    .returning();
  return updated;
}

export async function toggleDevelopmentActive(id: string, active: boolean) {
  const [updated] = await db
    .update(developments)
    .set({ active, updatedAt: new Date() })
    .where(eq(developments.id, id))
    .returning();
  return updated;
}
