import { eq } from "drizzle-orm";
import { db, canUseDatabase } from "@/lib/db";
import { sales } from "@/lib/db/schema";

export async function getSaleByClientId(clientId: string) {
  if (!canUseDatabase()) return null;
  return db.query.sales.findFirst({
    where: eq(sales.clientId, clientId),
    with: {
      client: true,
      reservation: true,
      development: true,
      stand: true,
      installmentPlan: { with: { installments: { orderBy: (i, { asc }) => [asc(i.sequence)] } } },
      payments: { orderBy: (p, { desc }) => [desc(p.paidAt)] },
      documents: true,
      commissions: true,
    },
  });
}

export async function getSaleById(id: string) {
  if (!canUseDatabase()) return null;
  return db.query.sales.findFirst({
    where: eq(sales.id, id),
    with: {
      client: true,
      reservation: true,
      development: true,
      stand: true,
      agent: { with: { user: true } },
      installmentPlan: { with: { installments: { orderBy: (i, { asc }) => [asc(i.sequence)] } } },
      payments: { orderBy: (p, { desc }) => [desc(p.paidAt)] },
      documents: true,
      commissions: { with: { agent: { with: { user: true } } } },
    },
  });
}

export async function getAllSales() {
  if (!canUseDatabase()) return [];
  return db.query.sales.findMany({
    with: {
      client: true,
      reservation: true,
      development: true,
      stand: true,
      agent: { with: { user: true } },
      payments: true,
    },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

export async function getSalesByAgent(agentId: string) {
  if (!canUseDatabase()) return [];
  return db.query.sales.findMany({
    where: eq(sales.agentId, agentId),
    with: { client: true, development: true, stand: true },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}

export async function updateSaleBalance(id: string, depositPaid: string, outstandingBalance: string) {
  const [updated] = await db
    .update(sales)
    .set({ depositPaid, outstandingBalance, updatedAt: new Date() })
    .where(eq(sales.id, id))
    .returning();
  return updated;
}

/** Enriched sales data for the interactive Sales Register — includes installment summaries & commissions */
export async function getSalesRegisterData() {
  if (!canUseDatabase()) return [];
  return db.query.sales.findMany({
    with: {
      client: true,
      reservation: true,
      development: true,
      stand: true,
      agent: { with: { user: true } },
      installmentPlan: {
        with: {
          installments: {
            orderBy: (i, { asc }) => [asc(i.sequence)],
          },
        },
      },
      commissions: {
        with: { agent: { with: { user: true } } },
      },
      payments: true,
    },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });
}
