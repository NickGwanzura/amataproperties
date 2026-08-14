import { and, eq, inArray, or } from "drizzle-orm";
import {
  agentProfiles,
  clients,
  commissions,
  developments,
  documents,
  installmentPlans,
  installments,
  leads,
  notifications,
  payments,
  reservations,
  sales,
  stands,
  users,
} from "@/lib/db/schema";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { presaleEmail, reservationConfirmedEmail } from "@/lib/email-templates";
import { buildSaleFromReservation } from "@/lib/services/sale-conversion";

type SmokeSummary = {
  smokeId: string;
  cleaned: boolean;
  reference: string;
  saleNumber: string;
  paymentReference: string;
  counts: Record<string, number>;
  notifications: string[];
  ids: Record<string, string | null>;
};

const keep = process.argv.includes("--keep");
const smokeId = `SMOKE-${Date.now().toString(36).toUpperCase()}`;
const clientEmail = `smoke-amata@amataproperties.com`;
const clientName = `Smoke Test ${smokeId}`;
const reference = `PRE-${new Date().getFullYear()}-${smokeId.slice(-5)}`;
const paymentReference = `DEP-${reference}`;

const createdIds = {
  developmentId: null as string | null,
  standId: null as string | null,
  clientId: null as string | null,
  leadId: null as string | null,
  reservationId: null as string | null,
  saleId: null as string | null,
  planId: null as string | null,
};

async function pickActiveAgent() {
  const agents = await db.query.agentProfiles.findMany({
    where: eq(agentProfiles.active, true),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      reservations: true,
    },
  });
  return agents
    .filter((agent) => agent.user)
    .sort((a, b) => a.reservations.length - b.reservations.length)[0] ?? null;
}

async function pickVerifierUserId() {
  const user = await db.query.users.findFirst({
    where: inArray(users.role, ["ACCOUNTS", "ADMINISTRATOR", "SYSTEM_ADMIN"]),
  });
  if (!user) throw new Error("No accounts/admin/system user exists to verify the payment.");
  return user.id;
}

async function cleanup() {
  if (createdIds.saleId) {
    await db.delete(payments).where(eq(payments.saleId, createdIds.saleId));
    await db.delete(commissions).where(eq(commissions.saleId, createdIds.saleId));
    if (createdIds.planId) {
      await db.delete(installments).where(eq(installments.planId, createdIds.planId));
      await db.delete(installmentPlans).where(eq(installmentPlans.id, createdIds.planId));
    }
    await db.delete(documents).where(eq(documents.saleId, createdIds.saleId));
    await db.delete(sales).where(eq(sales.id, createdIds.saleId));
  }
  if (createdIds.reservationId) {
    await db.delete(payments).where(eq(payments.reservationId, createdIds.reservationId));
    await db.delete(reservations).where(eq(reservations.id, createdIds.reservationId));
  }
  if (createdIds.developmentId) {
    await db.delete(documents).where(eq(documents.developmentId, createdIds.developmentId));
  }
  if (createdIds.leadId) await db.delete(leads).where(eq(leads.id, createdIds.leadId));
  if (createdIds.clientId) await db.delete(clients).where(eq(clients.id, createdIds.clientId));
  if (createdIds.standId) await db.delete(stands).where(eq(stands.id, createdIds.standId));
  if (createdIds.developmentId) await db.delete(developments).where(eq(developments.id, createdIds.developmentId));
  await db
    .delete(notifications)
    .where(
      or(
        eq(notifications.recipient, clientEmail),
        eq(notifications.subject, `New lead assigned: ${clientName} - ${reference}`),
        eq(notifications.subject, `New lead assigned: ${clientName} — ${reference}`),
        eq(notifications.subject, `Reservation ${reference} confirmed — deposit due within 24 hours`),
        eq(notifications.subject, `Presale confirmed — ${smokeId} Estate Stand ${smokeId}`),
      ),
    );
}

async function main(): Promise<SmokeSummary> {
  const agent = await pickActiveAgent();
  const verifiedByUserId = await pickVerifierUserId();

  const [development] = await db
    .insert(developments)
    .values({
      slug: `smoke-${smokeId.toLowerCase()}`,
      name: `${smokeId} Estate`,
      location: "Smoke Test",
      province: "Smoke",
      description: "Temporary smoke-test development.",
      developerName: "Amata Smoke Test",
      developerContact: "smoke@amataproperties.com",
      startingPrice: "10000",
      pricePerSqm: "25",
      depositAmount: "1000",
      interestRate: "0",
      paymentDurationMonths: 12,
      paymentTerms: "Smoke test payment terms",
      termsAndConditions: "Smoke test only",
      amenities: [],
      infrastructureStatus: "Smoke test",
      heroImage: "/images/placeholder.jpg",
      gallery: [],
      active: false,
    })
    .returning();
  createdIds.developmentId = development.id;

  const [stand] = await db
    .insert(stands)
    .values({
      developmentId: development.id,
      standNumber: smokeId,
      sizeSqm: 400,
      price: "10000",
      status: "AVAILABLE",
      phase: "Smoke",
    })
    .returning();
  createdIds.standId = stand.id;

  const [reservedStand] = await db
    .update(stands)
    .set({ status: "RESERVED", updatedAt: new Date() })
    .where(and(eq(stands.id, stand.id), eq(stands.status, "AVAILABLE")))
    .returning();
  if (!reservedStand) throw new Error("Smoke stand could not be reserved.");

  const [client] = await db
    .insert(clients)
    .values({
      name: clientName,
      nationalId: `${smokeId}-ID`,
      phone: "+263 77 000 0000",
      email: clientEmail,
      address: "Smoke Test Address",
    })
    .returning();
  createdIds.clientId = client.id;

  const [lead] = await db
    .insert(leads)
    .values({
      clientId: client.id,
      developmentId: development.id,
      agentId: agent?.id ?? null,
      name: client.name,
      nationalId: client.nationalId,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: "Smoke test reservation flow",
      source: "smoke-test",
      status: "NEW",
    })
    .returning();
  createdIds.leadId = lead.id;

  const [reservation] = await db
    .insert(reservations)
    .values({
      reference,
      clientId: client.id,
      agentId: agent?.id ?? null,
      developmentId: development.id,
      standId: stand.id,
      status: "PENDING",
      message: "Smoke test reservation flow",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();
  createdIds.reservationId = reservation.id;

  await Promise.all([
    sendNotification({
      recipient: agent?.user?.email ?? "accounts@amataproperties.com",
      subject: `New lead assigned: ${client.name} — ${reference}`,
      body: `Smoke test lead assigned. Reference: ${reference}.`,
    }),
    sendNotification({
      recipient: client.email,
      subject: `Reservation ${reference} confirmed — deposit due within 24 hours`,
      body: `Your reservation for stand ${stand.standNumber} at ${development.name} has been received. Reference: ${reference}.`,
      html: reservationConfirmedEmail({
        clientName: client.name,
        standNumber: stand.standNumber,
        developmentName: development.name,
        reference,
        agentName: agent?.user?.name ?? undefined,
        agentEmail: agent?.user?.email ?? undefined,
      }),
    }),
  ]);

  await db
    .update(reservations)
    .set({ status: "PRESALE", updatedAt: new Date() })
    .where(eq(reservations.id, reservation.id));
  await db.insert(documents).values({
    type: "RESERVATION_FORM",
    title: `Reservation Form — ${reference}`,
    url: `/documents/${reference}-reservation.pdf`,
    developmentId: development.id,
  });
  await db.update(leads).set({ status: "PRESALE_INITIATED", updatedAt: new Date() }).where(eq(leads.id, lead.id));
  await sendNotification({
    recipient: client.email,
    subject: `Presale confirmed — ${development.name} Stand ${stand.standNumber}`,
    body: `Your reservation at ${development.name} has been advanced to Presale status. Reference: ${reference}.`,
    html: presaleEmail({
      clientName: client.name,
      standNumber: stand.standNumber,
      developmentName: development.name,
      reference,
      agentName: agent?.user?.name ?? undefined,
    }),
  });

  await db
    .update(reservations)
    .set({ status: "AWAITING_DEPOSIT", updatedAt: new Date() })
    .where(eq(reservations.id, reservation.id));

  const { saleId, saleNumber: generatedSaleNumber, planId } = await buildSaleFromReservation({
    reservationId: reservation.id,
    clientId: client.id,
    clientEmail: client.email,
    clientName: client.name,
    agentId: agent?.id ?? null,
    agentEmail: agent?.user?.email ?? null,
    commissionRate: agent?.commissionRate ?? "500",
    developmentId: development.id,
    developmentName: development.name,
    developmentDeposit: Number(development.depositAmount),
    developmentInterest: development.interestRate,
    standId: stand.id,
    standNumber: stand.standNumber,
    standSizeSqm: stand.sizeSqm,
    reference,
    purchasePrice: Number(stand.price),
    depositAmount: Number(development.depositAmount),
    depositMethod: "BANK_TRANSFER",
    depositReference: paymentReference,
    depositNotes: "Smoke test deposit",
    months: development.paymentDurationMonths,
    verifiedByUserId,
  });
  createdIds.saleId = saleId;
  createdIds.planId = planId;

  const [
    reservationCount,
    saleCount,
    paymentCount,
    planCount,
    installmentCount,
    documentCount,
    commissionCount,
    notificationRows,
  ] = await Promise.all([
    db.query.reservations.findMany({ where: eq(reservations.id, reservation.id) }),
    db.query.sales.findMany({ where: eq(sales.id, saleId) }),
    db.query.payments.findMany({ where: eq(payments.reservationId, reservation.id) }),
    db.query.installmentPlans.findMany({ where: eq(installmentPlans.saleId, saleId) }),
    db.query.installments.findMany({ where: createdIds.planId ? eq(installments.planId, createdIds.planId) : undefined }),
    db.query.documents.findMany({ where: eq(documents.saleId, saleId) }),
    db.query.commissions.findMany({ where: eq(commissions.saleId, saleId) }),
    db.query.notifications.findMany({
      where: or(eq(notifications.recipient, client.email), agent?.user?.email ? eq(notifications.recipient, agent.user.email) : eq(notifications.recipient, client.email)),
    }),
  ]);

  const relevantNotifications = notificationRows
    .filter((row) => row.subject.includes(reference) || row.subject.includes(generatedSaleNumber) || row.subject.includes(development.name))
    .map((row) => row.subject)
    .sort();

  const summary: SmokeSummary = {
    smokeId,
    cleaned: !keep,
    reference,
    saleNumber: generatedSaleNumber,
    paymentReference,
    counts: {
      reservations: reservationCount.length,
      sales: saleCount.length,
      depositPayments: paymentCount.length,
      installmentPlans: planCount.length,
      installments: installmentCount.length,
      saleDocuments: documentCount.length,
      commissions: commissionCount.length,
      relevantNotifications: relevantNotifications.length,
    },
    notifications: relevantNotifications,
    ids: createdIds,
  };

  if (!keep) await cleanup();
  return summary;
}

main()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch(async (error) => {
    console.error(error);
    if (!keep) await cleanup().catch((cleanupError) => console.error("Cleanup failed", cleanupError));
    process.exit(1);
  });
