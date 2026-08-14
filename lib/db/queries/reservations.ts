import { eq, inArray, lt, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservations, type NewReservation } from "@/lib/db/schema";

export async function createReservation(data: NewReservation) {
  const [created] = await db.insert(reservations).values(data).returning();
  return created;
}

export async function getReservationByReference(reference: string) {
  return db.query.reservations.findFirst({
    where: eq(reservations.reference, reference),
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
      payments: true,
    },
  });
}

export async function getReservationsAwaitingDeposit() {
  return db.query.reservations.findMany({
    where: inArray(reservations.status, ["AWAITING_DEPOSIT", "PRESALE"]),
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
      payments: true,
    },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  });
}

export async function getReservationsByAgent(agentId: string) {
  return db.query.reservations.findMany({
    where: eq(reservations.agentId, agentId),
    with: { client: true, development: true, stand: true, sale: true },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getReservationsByClient(clientId: string) {
  return db.query.reservations.findMany({
    where: eq(reservations.clientId, clientId),
    with: { development: true, stand: true },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function updateReservationStatus(
  id: string,
  status: "PENDING" | "PRESALE" | "AWAITING_DEPOSIT" | "APPROVED" | "CANCELLED" | "EXPIRED",
) {
  const [updated] = await db
    .update(reservations)
    .set({ status, updatedAt: new Date() })
    .where(eq(reservations.id, id))
    .returning();
  return updated;
}

export async function getAllReservations() {
  return db.query.reservations.findMany({
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
      sale: true,
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getRecentActiveReservations(limit = 10) {
  return db.query.reservations.findMany({
    where: inArray(reservations.status, ["PRESALE", "AWAITING_DEPOSIT", "PENDING"]),
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    limit,
  });
}

export async function cancelExpiredReservations() {
  const now = new Date();
  return db
    .update(reservations)
    .set({ status: "EXPIRED", updatedAt: now })
    .where(
      and(
        inArray(reservations.status, ["PENDING"]),
        lt(reservations.expiresAt, now),
      )
    )
    .returning();
}
