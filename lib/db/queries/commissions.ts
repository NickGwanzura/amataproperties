import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { commissions } from "@/lib/db/schema";

export async function getCommissionsByAgent(agentId: string) {
  return db.query.commissions.findMany({
    where: eq(commissions.agentId, agentId),
    with: { sale: { with: { development: true, stand: true, client: true } } },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function getAllCommissions() {
  return db.query.commissions.findMany({
    with: {
      agent: { with: { user: true } },
      sale: { with: { development: true, stand: true, client: true } },
    },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

export async function createCommission(saleId: string, agentId: string, amount = "500") {
  const [created] = await db
    .insert(commissions)
    .values({ saleId, agentId, amount })
    .returning();
  return created;
}

export async function approveCommission(id: string) {
  const [updated] = await db
    .update(commissions)
    .set({ status: "APPROVED", approvedAt: new Date() })
    .where(eq(commissions.id, id))
    .returning();
  return updated;
}

export async function markCommissionPaid(id: string) {
  const [updated] = await db
    .update(commissions)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(commissions.id, id))
    .returning();
  return updated;
}

export async function voidCommission(id: string) {
  const [updated] = await db
    .update(commissions)
    .set({ status: "VOID" })
    .where(eq(commissions.id, id))
    .returning();
  return updated;
}
