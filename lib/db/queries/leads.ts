import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, type NewLead } from "@/lib/db/schema";

export async function getLeadsByAgent(agentId: string) {
  return db.query.leads.findMany({
    where: eq(leads.agentId, agentId),
    with: {
      client: true,
      development: true,
    },
    orderBy: (l, { desc }) => [desc(l.createdAt)],
  });
}

export async function getAllLeads() {
  return db.query.leads.findMany({
    with: { client: true, development: true, agent: { with: { user: true } } },
    orderBy: (l, { desc }) => [desc(l.createdAt)],
  });
}

export async function createLead(data: NewLead) {
  const [created] = await db.insert(leads).values(data).returning();
  return created;
}

export async function updateLeadStatus(
  id: string,
  status: "NEW" | "CONTACTED" | "INTERESTED" | "SITE_VISIT_BOOKED" | "NEGOTIATING" | "PRESALE_INITIATED" | "CONVERTED_TO_SALE" | "LOST",
) {
  const [updated] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return updated;
}

export async function updateLead(id: string, data: Partial<NewLead>) {
  const [updated] = await db
    .update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return updated;
}
