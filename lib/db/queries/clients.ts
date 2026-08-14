import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, type Client, type NewClient } from "@/lib/db/schema";

export async function getClientByUserId(userId: string) {
  return db.query.clients.findFirst({
    where: eq(clients.userId, userId),
    with: {
      sales: {
        with: {
          development: true,
          stand: true,
          client: true,
          reservation: true,
          agent: { with: { user: true } },
          installmentPlan: { with: { installments: { orderBy: (i, { asc }) => [asc(i.sequence)] } } },
          payments: { orderBy: (p, { desc }) => [desc(p.paidAt)] },
          documents: true,
        },
      },
      leads: true,
      reservations: {
        with: { development: true, stand: true },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
      },
    },
  });
}

export async function getClientById(id: string) {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      sales: { with: { development: true, stand: true } },
      leads: true,
    },
  });
}

export async function getAllClients(): Promise<Client[]> {
  return db.query.clients.findMany({
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function getAllClientsWithRecords() {
  return db.query.clients.findMany({
    with: {
      sales: {
        with: {
          development: true,
          stand: true,
          payments: {
            orderBy: (p, { desc }) => [desc(p.paidAt)],
          },
        },
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      },
      reservations: {
        with: { development: true, stand: true },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
      },
      leads: {
        with: { development: true },
        orderBy: (l, { desc }) => [desc(l.createdAt)],
      },
    },
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function getKycCompleteClients() {
  return db.query.clients.findMany({
    where: eq(clients.kycStatus, "COMPLETE"),
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}

export async function createClient(data: NewClient) {
  const [created] = await db.insert(clients).values(data).returning();
  return created;
}

export async function upsertClientByEmail(data: NewClient) {
  const existing = await db.query.clients.findFirst({
    where: eq(clients.email, data.email),
  });
  if (existing) return existing;
  return createClient(data);
}

export async function updateClientKyc(
  id: string,
  kycStatus: "NOT_STARTED" | "IN_REVIEW" | "COMPLETE" | "REJECTED",
  documents?: {
    nationalIdFrontUrl?: string;
    nationalIdBackUrl?: string;
    passportCopyUrl?: string;
    proofOfResidenceUrl?: string;
    passportPhotoUrl?: string;
  },
) {
  const [updated] = await db
    .update(clients)
    .set({ kycStatus, ...documents, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  return updated;
}
