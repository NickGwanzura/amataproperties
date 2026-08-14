import { db } from "@/lib/db/index";
import { stands, developments, clients, reservations as reservationsTable, sales as salesTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { buildSaleFromReservation } from "@/lib/services/sale-conversion";
import { auditLog } from "@/lib/audit";

export type GroupAllocationInput = {
  groupId: string;
  clientId: string;
  standId: string;
  depositAmount: number;
  depositMethod: "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER";
  depositReference: string;
  months?: number;
  verifiedByUserId: string;
};

export type GroupAllocationResult =
  | { ok: true; saleNumber: string; standNumber: string; clientName: string }
  | { ok: false; error: string; clientId: string; standId: string };

/**
 * Allocates one group member to one stand — creates a reservation exactly the
 * way createAgentPresaleAction/createDirectSaleAction already do for individual
 * presales, then calls buildSaleFromReservation unmodified. This is the only
 * new code in the money path; the sale-conversion function itself and its
 * existing call sites are untouched. Called once per member in a loop by the
 * group wizard's "assign stands" step — never batched into one transaction,
 * since one failed allocation must not roll back the others.
 */
export async function allocateGroupMemberToStand(input: GroupAllocationInput): Promise<GroupAllocationResult> {
  const client = await db.query.clients.findFirst({ where: eq(clients.id, input.clientId) });
  if (!client) return { ok: false, error: "Client not found.", clientId: input.clientId, standId: input.standId };

  const reference = `GRP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  let setup: { stand: typeof stands.$inferSelect; development: typeof developments.$inferSelect; reservation: typeof reservationsTable.$inferSelect } | null = null;

  try {
    setup = await db.transaction(async (tx) => {
      const [stand] = await tx
        .update(stands)
        .set({ status: "RESERVED", updatedAt: new Date() })
        .where(and(eq(stands.id, input.standId), eq(stands.status, "AVAILABLE")))
        .returning();
      if (!stand) throw new Error("Stand is no longer available.");

      const [development] = await tx.select().from(developments).where(eq(developments.id, stand.developmentId));
      if (!development) throw new Error("Development not found.");

      const [reservation] = await tx
        .insert(reservationsTable)
        .values({
          reference,
          clientId: client.id,
          agentId: null,
          developmentId: stand.developmentId,
          standId: stand.id,
          status: "APPROVED",
          message: `Group allocation`,
        })
        .returning();

      return { stand, development, reservation };
    });

    if (!setup) throw new Error("Allocation setup failed.");

    const months = input.months ?? setup.development.paymentDurationMonths;

    const result = await buildSaleFromReservation({
      reservationId: setup.reservation.id,
      clientId: client.id,
      clientEmail: client.email,
      clientName: client.name,
      agentId: null,
      agentEmail: null,
      commissionRate: "0",
      developmentId: setup.stand.developmentId,
      developmentName: setup.development.name,
      developmentDeposit: parseFloat(setup.development.depositAmount),
      developmentInterest: setup.development.interestRate,
      standId: setup.stand.id,
      standNumber: setup.stand.standNumber,
      standSizeSqm: setup.stand.sizeSqm,
      reference,
      purchasePrice: parseFloat(setup.stand.price),
      depositAmount: input.depositAmount,
      depositMethod: input.depositMethod,
      depositReference: input.depositReference,
      depositNotes: `Group allocation (group ${input.groupId})`,
      months,
      verifiedByUserId: input.verifiedByUserId,
    });

    await auditLog({
      action: "GROUP_ALLOCATE_STAND",
      module: "GROUP_BUYING",
      newValue: { groupId: input.groupId, clientId: client.id, standId: setup.stand.id, saleNumber: result.saleNumber },
    }).catch(() => undefined);

    return { ok: true, saleNumber: result.saleNumber, standNumber: setup.stand.standNumber, clientName: client.name };
  } catch (err) {
    if (setup) {
      await db.transaction(async (tx) => {
        const existingSale = await tx.query.sales.findFirst({ where: eq(salesTable.reservationId, setup!.reservation.id) });
        if (!existingSale) {
          await tx
            .update(reservationsTable)
            .set({ status: "CANCELLED", updatedAt: new Date() })
            .where(eq(reservationsTable.id, setup!.reservation.id));
          await tx
            .update(stands)
            .set({ status: "AVAILABLE", updatedAt: new Date() })
            .where(eq(stands.id, setup!.stand.id));
        }
      }).catch(() => undefined);
    }

    return { ok: false, error: err instanceof Error ? err.message : "Allocation failed.", clientId: input.clientId, standId: input.standId };
  }
}
