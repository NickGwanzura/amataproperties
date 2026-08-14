import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, clients, sales, installments, installmentPlans, type NewGroup } from "@/lib/db/schema";

export async function getAllGroups() {
  return db.query.groups.findMany({
    with: { development: true, groupAdmin: true },
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  });
}

export async function getGroupById(id: string) {
  return db.query.groups.findFirst({
    where: eq(groups.id, id),
    with: { development: true, groupAdmin: true, members: true },
  });
}

export async function getGroupByAdminUserId(userId: string) {
  return db.query.groups.findFirst({
    where: eq(groups.groupAdminUserId, userId),
    with: { development: true },
  });
}

export async function getGroupMembers(groupId: string) {
  return db.query.clients.findMany({
    where: eq(clients.groupId, groupId),
    with: {
      sales: { with: { stand: true }, orderBy: (s, { desc }) => [desc(s.createdAt)] },
      reservations: { with: { stand: true }, orderBy: (r, { desc }) => [desc(r.createdAt)] },
    },
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function createGroup(data: NewGroup) {
  const [created] = await db.insert(groups).values(data).returning();
  return created;
}

export async function updateGroup(id: string, data: Partial<NewGroup>) {
  const [updated] = await db
    .update(groups)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(groups.id, id))
    .returning();
  return updated;
}

/**
 * Group-level collections/cash-flow KPIs — same aggregate style as
 * getInstallmentRevenueSummary in lib/db/queries/revenue.ts, joined through
 * clients.groupId rather than reinventing the aggregation math.
 */
export async function getGroupKpis(groupId: string) {
  const [memberTotals] = await db
    .select({ memberCount: count(clients.id) })
    .from(clients)
    .where(eq(clients.groupId, groupId));

  const [salesTotals] = await db
    .select({
      allocatedStands: count(sales.id),
      purchasePriceSum: sql<string>`coalesce(sum(${sales.purchasePrice}), 0)`,
      depositPaidSum: sql<string>`coalesce(sum(${sales.depositPaid}), 0)`,
      outstandingSum: sql<string>`coalesce(sum(${sales.outstandingBalance}), 0)`,
    })
    .from(sales)
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .where(and(eq(clients.groupId, groupId), sql`${sales.status} in ('ACTIVE', 'PAID_OFF')`));

  const [collected] = await db
    .select({ total: sql<string>`coalesce(sum(${installments.amountPaid}), 0)` })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .where(eq(clients.groupId, groupId));

  const [overdue] = await db
    .select({ count: count() })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .where(
      and(
        eq(clients.groupId, groupId),
        eq(sales.status, "ACTIVE"),
        sql`${installments.dueDate} < now()`,
        sql`${installments.amountPaid} < ${installments.amountDue}`,
      ),
    );

  return {
    memberCount: Number(memberTotals?.memberCount ?? 0),
    allocatedStands: Number(salesTotals?.allocatedStands ?? 0),
    totalValue: parseFloat(salesTotals?.purchasePriceSum ?? "0"),
    totalCollected: parseFloat(collected?.total ?? "0"),
    depositsCollected: parseFloat(salesTotals?.depositPaidSum ?? "0"),
    outstandingBalance: parseFloat(salesTotals?.outstandingSum ?? "0"),
    overdueInstallments: Number(overdue?.count ?? 0),
  };
}
