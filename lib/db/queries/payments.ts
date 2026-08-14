import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, type NewPayment } from "@/lib/db/schema";

export async function getPaymentsBySale(saleId: string) {
  return db.query.payments.findMany({
    where: eq(payments.saleId, saleId),
    orderBy: (p, { desc }) => [desc(p.paidAt)],
  });
}

export async function getPaymentsByClient(clientId: string) {
  return db.query.payments.findMany({
    where: eq(payments.clientId, clientId),
    with: { sale: { with: { development: true, stand: true } } },
    orderBy: (p, { desc }) => [desc(p.paidAt)],
  });
}

export async function getPaymentsByReservation(reservationId: string) {
  return db.query.payments.findMany({
    where: eq(payments.reservationId, reservationId),
    orderBy: (p, { desc }) => [desc(p.paidAt)],
  });
}

export async function createPayment(data: NewPayment) {
  const [created] = await db.insert(payments).values(data).returning();
  return created;
}

export async function verifyPayment(id: string, verifiedByUserId: string) {
  const [updated] = await db
    .update(payments)
    .set({ status: "VERIFIED", verifiedByUserId })
    .where(eq(payments.id, id))
    .returning();
  return updated;
}

export async function rejectPayment(id: string, verifiedByUserId: string) {
  const [updated] = await db
    .update(payments)
    .set({ status: "FAILED", verifiedByUserId })
    .where(eq(payments.id, id))
    .returning();
  return updated;
}

export async function getAllPayments() {
  return db.query.payments.findMany({
    with: {
      client: true,
      reservation: { with: { development: true, stand: true } },
      sale: { with: { development: true, stand: true } },
    },
    orderBy: (p, { desc }) => [desc(p.paidAt)],
  });
}

export type PaymentWithRelations = Awaited<ReturnType<typeof getAllPayments>>[number];
