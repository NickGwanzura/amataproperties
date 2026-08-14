"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/index";
import {
  commissions, payments, stands, developments, users, leads,
  reservations as reservationsTable,
  sales as salesTable,
  installments as installmentsTable,
  installmentPlans as installmentPlansTable,
  documents,
  accounts,
  agentProfiles,
  clients,
  auditLogs,
  verifications,
  blogPosts,
  standHistory,
  groups,
} from "@/lib/db/schema";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { sendNotification } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";
import { uploadFile, isStorageConfigured, saleDocKey } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { presaleEmail, agentPresaleNotificationEmail, adminPresaleAlertEmail, installmentReceivedEmail, adminPaymentAlertEmail, inviteEmail, inviteWithLinkEmail, allocationEmail } from "@/lib/email-templates";
import type { AuthUser, UserRole } from "@/lib/auth-token";
import { buildSaleFromReservation } from "@/lib/services/sale-conversion";
import { buildInstallmentAmounts, getSaleFinancialSnapshot } from "@/lib/finance";
export type { SaleInput, SaleResult } from "@/lib/services/sale-conversion";
import { allocateGroupMemberToStand } from "@/lib/services/group-allocation";

const ADMIN_ROLES: UserRole[] = ["ADMINISTRATOR", "SYSTEM_ADMIN"];
const SYSADMIN_ROLES: UserRole[] = ["SYSTEM_ADMIN"];
const ACCOUNTS_ROLES: UserRole[] = ["ACCOUNTS", "ADMINISTRATOR", "SYSTEM_ADMIN"];
const AGENT_ROLES: UserRole[] = ["AGENT"];
const PAYMENT_RECORDING_ROLES: UserRole[] = [...ACCOUNTS_ROLES, ...AGENT_ROLES];
const MONEY_EPSILON = 0.005;
const PAYMENT_TYPES = ["DEPOSIT", "INSTALLMENT", "ADJUSTMENT"] as const;
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "ECOCASH", "VELOCITY", "OTHER"] as const;
type RecordablePaymentType = (typeof PAYMENT_TYPES)[number];
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function paymentTypeLabel(type: RecordablePaymentType) {
  return type === "DEPOSIT" ? "Deposit" : type === "INSTALLMENT" ? "Installment" : "Admin Fee";
}

async function requireRole(allowedRoles: readonly UserRole[]): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Records a one-off admin fee as an ADJUSTMENT payment. This is billed on
 * top of the purchase price — it does NOT reduce the sale's outstanding
 * balance or installment schedule.
 */
async function recordAdminFee(params: {
  clientId: string;
  reservationId: string;
  saleId: string;
  method: "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER";
  amount: number;
  reference: string;
  verifiedByUserId: string;
}) {
  await db.insert(payments).values({
    clientId: params.clientId,
    reservationId: params.reservationId,
    saleId: params.saleId,
    type: "ADJUSTMENT",
    method: params.method,
    status: "VERIFIED",
    amount: String(params.amount),
    currency: "USD",
    reference: params.reference,
    notes: "Admin fee",
    verifiedByUserId: params.verifiedByUserId,
    paidAt: new Date(),
  });
}

async function applyPropertyPaymentToSale(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  saleId: string,
  amountRaw: number,
  paidAt: Date,
  options: { isDeposit?: boolean } = {},
) {
  const sale = await tx.query.sales.findFirst({
    where: eq(salesTable.id, saleId),
    with: { installmentPlan: { with: { installments: { orderBy: (i, { asc }) => [asc(i.sequence)] } } } },
  });
  if (!sale) return null;

  const newBalance = Math.max(0, parseFloat(sale.outstandingBalance) - amountRaw);
  await tx
    .update(salesTable)
    .set({
      outstandingBalance: newBalance.toFixed(2),
      ...(options.isDeposit
        ? { depositPaid: (parseFloat(sale.depositPaid) + amountRaw).toFixed(2) }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(salesTable.id, saleId));

  let remaining = amountRaw;
  for (const row of sale.installmentPlan?.installments ?? []) {
    if (remaining <= MONEY_EPSILON) break;
    const alreadyPaid = parseFloat(row.amountPaid);
    const due = parseFloat(row.amountDue);
    if (alreadyPaid >= due - MONEY_EPSILON) continue;

    const rowBalance = due - alreadyPaid;
    const nextPaid = remaining >= rowBalance - MONEY_EPSILON ? due : alreadyPaid + remaining;
    await tx
      .update(installmentsTable)
      .set({
        amountPaid: nextPaid.toFixed(2),
        paidAt: nextPaid >= due - MONEY_EPSILON ? paidAt : row.paidAt,
      })
      .where(eq(installmentsTable.id, row.id));
    remaining -= Math.min(remaining, rowBalance);
  }

  return { previousBalance: parseFloat(sale.outstandingBalance), newBalance };
}

async function applyInstallmentPaymentToSale(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  saleId: string,
  amountRaw: number,
  paidAt: Date,
) {
  return applyPropertyPaymentToSale(tx, saleId, amountRaw, paidAt);
}

/**
 * Reverses the effect of a previously applied installment payment.
 * Increases outstandingBalance and walks installments in reverse sequence
 * to subtract from amountPaid.
 */
async function reverseInstallmentPaymentFromSale(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  saleId: string,
  amountRaw: number,
) {
  const sale = await tx.query.sales.findFirst({
    where: eq(salesTable.id, saleId),
    with: { installmentPlan: { with: { installments: { orderBy: (i, { desc }) => [desc(i.sequence)] } } } },
  });
  if (!sale) return null;

  const previousBalance = parseFloat(sale.outstandingBalance);
  const newBalance = previousBalance + amountRaw;
  await tx
    .update(salesTable)
    .set({ outstandingBalance: newBalance.toFixed(2), updatedAt: new Date() })
    .where(eq(salesTable.id, saleId));

  let remaining = amountRaw;
  for (const row of sale.installmentPlan?.installments ?? []) {
    if (remaining <= MONEY_EPSILON) break;
    const alreadyPaid = parseFloat(row.amountPaid);
    if (alreadyPaid <= MONEY_EPSILON) continue;

    const amountToTake = Math.min(remaining, alreadyPaid);
    const newAmountPaid = Math.max(0, alreadyPaid - amountToTake);
    await tx
      .update(installmentsTable)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        paidAt: newAmountPaid <= MONEY_EPSILON ? null : row.paidAt,
      })
      .where(eq(installmentsTable.id, row.id));
    remaining -= amountToTake;
  }

  return { previousBalance, newBalance };
}

// ─── Reverse & Reassign Payment ──────────────────────────────────────────────

/**
 * Reverses a mis-recorded payment from one sale and re-assigns it to another.
 * Both the source and target sales must be ACTIVE.
 */
export async function reverseAndReassignPayment(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sessionUser = await requireRole(ACCOUNTS_ROLES);

  const paymentId    = (formData.get("paymentId")    as string)?.trim();
  const targetStandNumber = (formData.get("targetStandNumber") as string)?.trim();

  if (!paymentId || !targetStandNumber)
    return { ok: false, error: "Payment ID and target stand number are required." };

  // Fetch the original payment with its sale (including stand for notes)
  const originalPayment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: { sale: { with: { stand: true } } },
  });
  if (!originalPayment)
    return { ok: false, error: "Payment not found." };
  if (originalPayment.status !== "VERIFIED")
    return { ok: false, error: "Only VERIFIED payments can be reassigned." };
  if (originalPayment.type !== "INSTALLMENT")
    return { ok: false, error: "Only INSTALLMENT payments can be reassigned." };
  if (!originalPayment.saleId)
    return { ok: false, error: "Payment is not linked to a sale." };

  // Fetch target stand
  const targetStand = await db.query.stands.findFirst({
    where: eq(stands.standNumber, targetStandNumber),
  });
  if (!targetStand)
    return { ok: false, error: `Stand ${targetStandNumber} not found.` };

  // Fetch target sale
  const targetSale = await db.query.sales.findFirst({
    where: eq(salesTable.standId, targetStand.id),
  });
  if (!targetSale)
    return { ok: false, error: `No active sale found for stand ${targetStandNumber}.` };
  if (targetSale.status !== "ACTIVE")
    return { ok: false, error: `Target sale is not ACTIVE (status: ${targetSale.status}).` };

  const amountValue = parseFloat(originalPayment.amount);
  const paidAtDate  = originalPayment.paidAt;

  // Run the reversal and re-application in a single atomic transaction
  await db.transaction(async (tx) => {
    // 1. Reverse the payment's effect on the source sale (stand 34791)
    await reverseInstallmentPaymentFromSale(
      tx,
      originalPayment.saleId!, // guarded above
      amountValue,
    );

    // 2. Mark the original payment as REVERSED
    await tx
      .update(payments)
      .set({ status: "REVERSED" })
      .where(eq(payments.id, paymentId));

    // 3. Apply the payment to the target sale
    await applyInstallmentPaymentToSale(tx, targetSale.id, amountValue, paidAtDate);

    // 4. Create a new payment record for the target sale
    await tx.insert(payments).values({
      clientId: targetSale.clientId,
      saleId: targetSale.id,
      type: originalPayment.type,
      method: originalPayment.method,
      status: "VERIFIED",
      amount: originalPayment.amount,
      currency: originalPayment.currency,
      reference: originalPayment.reference,
      notes: originalPayment.notes
        ? `${originalPayment.notes} | Reassigned from stand ${originalPayment.sale?.stand?.standNumber ?? originalPayment.saleId}`
        : `Reassigned from payment ${paymentId}`,
      verifiedByUserId: sessionUser.id,
      paidAt: paidAtDate,
    });
  });

  // 5. Audit log
  await auditLog({
    action: "REVERSE_AND_REASSIGN_PAYMENT",
    module: "ACCOUNTS",
    previousValue: { paymentId, sourceSaleId: originalPayment.saleId },
    newValue: { targetStandNumber, targetSaleId: targetSale.id, amount: amountValue, reference: originalPayment.reference },
  });

  revalidatePath("/accounts");
  revalidatePath("/accounts/payments");
  revalidatePath(`/accounts/statements/${originalPayment.saleId}`);
  revalidatePath(`/accounts/statements/${targetSale.id}`);
  revalidatePath("/client/statements");
  revalidatePath("/sysadmin/sales");
  revalidatePath("/client");
  return { ok: true };
}

async function notifyAdminsOfPresale(data: {
  reference: string;
  clientName: string;
  agentName: string;
  standNumber: string;
  developmentName: string;
  price: string;
  expiresAt: string;
}) {
  const admins = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["ADMINISTRATOR", "SYSTEM_ADMIN", "ACCOUNTS"]));

  await Promise.all(
    admins
      .filter((a) => a.email && a.email.includes("@"))
      .map((a) =>
        sendNotification({
          recipient: a.email,
          subject: `New Presale — ${data.reference} (${data.developmentName} Stand ${data.standNumber})`,
          body: `New presale ${data.reference} for ${data.clientName}. Stand ${data.standNumber}, ${data.developmentName}. Agent: ${data.agentName}. Expires ${data.expiresAt}.`,
          html: adminPresaleAlertEmail({ adminName: a.name, ...data }),
        }),
      ),
  );
}

async function ensureAgentProfile(userId: string) {
  const existing = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, userId),
  });
  if (!existing) {
    await db.insert(agentProfiles).values({ userId, active: true });
  }
}

export async function updateUserRole(userId: string, role: string) {
  await requireRole(ADMIN_ROLES);
  const [prevUser] = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId));
  await db.update(users).set({ role: role as "PUBLIC" | "CLIENT" | "AGENT" | "ACCOUNTS" | "ADMINISTRATOR" | "CEO" | "SYSTEM_ADMIN" | "GROUP_ADMIN", updatedAt: new Date() }).where(eq(users.id, userId));
  if (role === "AGENT") {
    await ensureAgentProfile(userId);
  }
  await auditLog({
    action: "UPDATE_USER_ROLE",
    module: "ADMIN",
    previousValue: { userId, previousRole: prevUser?.role },
    newValue: { userId, newRole: role },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function approveCommission(id: string) {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ amount: commissions.amount, status: commissions.status, saleId: commissions.saleId })
    .from(commissions)
    .where(eq(commissions.id, id));
  await db.update(commissions).set({ status: "APPROVED", approvedAt: new Date() }).where(eq(commissions.id, id));
  await auditLog({
    action: "APPROVE_COMMISSION",
    module: "COMMISSIONS",
    previousValue: prev,
    newValue: { commissionId: id, status: "APPROVED", approvedAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/agent/commissions");
}

export async function markCommissionPaid(id: string) {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ amount: commissions.amount, status: commissions.status, saleId: commissions.saleId })
    .from(commissions)
    .where(eq(commissions.id, id));
  await db.update(commissions).set({ status: "PAID", paidAt: new Date() }).where(eq(commissions.id, id));
  await auditLog({
    action: "MARK_COMMISSION_PAID",
    module: "COMMISSIONS",
    previousValue: prev,
    newValue: { commissionId: id, status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/agent/commissions");
}

export async function voidCommission(id: string) {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ amount: commissions.amount, status: commissions.status, saleId: commissions.saleId })
    .from(commissions)
    .where(eq(commissions.id, id));
  await db.update(commissions).set({ status: "VOID" }).where(eq(commissions.id, id));
  await auditLog({
    action: "VOID_COMMISSION",
    module: "COMMISSIONS",
    previousValue: prev,
    newValue: { commissionId: id, status: "VOID" },
  });
  revalidatePath("/admin");
  revalidatePath("/agent/commissions");
}

export type AgentPresaleState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
  reference?: string;
};

export type AgentLeadState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type AgentClientUpdateState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

function fieldError(field: string, message: string): AgentPresaleState {
  return { ok: false, message: "Please fix the highlighted fields and try again.", errors: { [field]: [message] } };
}

function leadFieldError(field: string, message: string): AgentLeadState {
  return { ok: false, message: "Please fix the highlighted fields and try again.", errors: { [field]: [message] } };
}

function clientFieldError(field: string, message: string): AgentClientUpdateState {
  return { ok: false, message: "Please fix the highlighted fields and try again.", errors: { [field]: [message] } };
}

/** Quick-approve using the development's default deposit amount */
export async function convertReservationToSale(reservationId: string) {
  const sessionUser = await requireRole(ACCOUNTS_ROLES);

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservationsTable.id, reservationId),
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
    },
  });

  if (!reservation || (reservation.status !== "AWAITING_DEPOSIT" && reservation.status !== "PRESALE")) return;

  const depositAmount = parseFloat(reservation.development.depositAmount);
  await buildSaleFromReservation({
    reservationId: reservation.id,
    clientId: reservation.clientId,
    clientEmail: reservation.client.email,
    clientName: reservation.client.name,
    agentId: reservation.agentId,
    agentEmail: reservation.agent?.user?.email ?? null,
    commissionRate: reservation.agent?.commissionRate ?? "500",
    developmentId: reservation.developmentId,
    developmentName: reservation.development.name,
    developmentDeposit: parseFloat(reservation.development.depositAmount),
    developmentInterest: reservation.development.interestRate,
    standId: reservation.standId,
    standNumber: reservation.stand.standNumber,
    standSizeSqm: reservation.stand.sizeSqm,
    reference: reservation.reference,
    purchasePrice: parseFloat(reservation.stand.price),
    depositAmount,
    depositMethod: "BANK_TRANSFER",
    depositReference: `DEP-${reservation.reference}`,
    depositNotes: undefined,
    months: reservation.development.paymentDurationMonths,
    verifiedByUserId: sessionUser.id,
  });
  revalidatePath("/accounts");
  revalidatePath("/admin");
  revalidatePath("/agent");
}

/**
 * Record a manual deposit with user-provided details, then convert to sale.
 * Form fields: amount, method, reference, notes
 */
export async function recordDepositAndConvert(reservationId: string, formData: FormData) {
  const sessionUser = await requireRole(ACCOUNTS_ROLES);

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservationsTable.id, reservationId),
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
    },
  });

  if (!reservation || (reservation.status !== "AWAITING_DEPOSIT" && reservation.status !== "PRESALE")) return;

  const amount = parseFloat(formData.get("amount") as string);
  if (!amount || amount <= 0) return;

  const method = (formData.get("method") as string) || "BANK_TRANSFER";
  const adminFee = parseFloat(formData.get("adminFee") as string) || 0;
  const adminFeeRef = ((formData.get("adminFeeReference") as string) || "").trim() || `ADM-${reservation.reference}`;

  const { saleId } = await buildSaleFromReservation({
    reservationId: reservation.id,
    clientId: reservation.clientId,
    clientEmail: reservation.client.email,
    clientName: reservation.client.name,
    agentId: reservation.agentId,
    agentEmail: reservation.agent?.user?.email ?? null,
    commissionRate: reservation.agent?.commissionRate ?? "500",
    developmentId: reservation.developmentId,
    developmentName: reservation.development.name,
    developmentDeposit: parseFloat(reservation.development.depositAmount),
    developmentInterest: reservation.development.interestRate,
    standId: reservation.standId,
    standNumber: reservation.stand.standNumber,
    standSizeSqm: reservation.stand.sizeSqm,
    reference: reservation.reference,
    purchasePrice: parseFloat(reservation.stand.price),
    depositAmount: amount,
    depositMethod: method,
    depositReference: (formData.get("reference") as string) || `DEP-${reservation.reference}`,
    depositNotes: (formData.get("notes") as string) || undefined,
    months: reservation.development.paymentDurationMonths,
    verifiedByUserId: sessionUser.id,
  });

  if (adminFee > 0) {
    await recordAdminFee({
      clientId: reservation.clientId,
      reservationId: reservation.id,
      saleId,
      method: method as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
      amount: adminFee,
      reference: adminFeeRef,
      verifiedByUserId: sessionUser.id,
    });
  }

  revalidatePath("/accounts");
  revalidatePath("/admin");
  revalidatePath("/agent");
}

export async function sysadminRecordSaleAction(reservationId: string, formData: FormData) {
  const sessionUser = await requireRole(SYSADMIN_ROLES);

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservationsTable.id, reservationId),
    with: {
      client: true,
      agent: { with: { user: true } },
      development: true,
      stand: true,
    },
  });

  if (!reservation || (reservation.status !== "AWAITING_DEPOSIT" && reservation.status !== "PRESALE")) return;

  const amount = parseFloat(formData.get("amount") as string);
  if (!amount || amount <= 0) return;

  const method = (formData.get("method") as string) || "CASH";
  const reference = (formData.get("reference") as string) || `DEP-${reservation.reference}`;
  const notes = (formData.get("notes") as string) || undefined;
  const adminFee = parseFloat(formData.get("adminFee") as string) || 0;
  const adminFeeRef = (formData.get("adminFeeRef") as string) || reference;

  // Ensure stand price matches sqm × pricePerSqm at conversion time
  const correctStandPrice = reservation.stand.sizeSqm * parseFloat(reservation.development.pricePerSqm);
  const currentStandPrice = parseFloat(reservation.stand.price);
  if (Math.abs(correctStandPrice - currentStandPrice) > 0.01) {
    await db.update(stands)
      .set({ price: correctStandPrice.toFixed(2), updatedAt: new Date() })
      .where(eq(stands.id, reservation.standId));
    reservation.stand.price = correctStandPrice.toFixed(2);
  }

  const { saleId, clientId } = await (async () => {
    const result = await buildSaleFromReservation({
      reservationId: reservation.id,
      clientId: reservation.clientId,
      clientEmail: reservation.client.email,
      clientName: reservation.client.name,
      agentId: reservation.agentId,
      agentEmail: reservation.agent?.user?.email ?? null,
      commissionRate: reservation.agent?.commissionRate ?? "500",
      developmentId: reservation.developmentId,
      developmentName: reservation.development.name,
      developmentDeposit: parseFloat(reservation.development.depositAmount),
      developmentInterest: reservation.development.interestRate,
      standId: reservation.standId,
      standNumber: reservation.stand.standNumber,
      standSizeSqm: reservation.stand.sizeSqm,
      reference: reservation.reference,
      purchasePrice: parseFloat(reservation.stand.price),
      depositAmount: amount,
      depositMethod: method as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
      depositReference: reference,
      depositNotes: notes,
      months: reservation.development.paymentDurationMonths,
      verifiedByUserId: sessionUser.id,
    });
    return { saleId: result.saleId, clientId: reservation.clientId };
  })();

  if (adminFee > 0) {
    await recordAdminFee({
      clientId,
      reservationId: reservation.id,
      saleId,
      method: method as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
      amount: adminFee,
      reference: adminFeeRef,
      verifiedByUserId: sessionUser.id,
    });
  }

  revalidatePath("/sysadmin/presales");
  revalidatePath("/sysadmin/sales");
  revalidatePath("/admin");
  revalidatePath("/agent");
}

export type DirectSaleState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
  saleNumber?: string;
};

function directSaleFieldError(field: string, message: string): DirectSaleState {
  return { ok: false, message: "Please fix the highlighted fields and try again.", errors: { [field]: [message] } };
}

/**
 * Accounts staff sell an available stand directly to a client, bypassing the
 * agent presale pipeline. Creates (or reuses) the client, an already-approved
 * reservation, then delegates to buildSaleFromReservation for the sale itself.
 */
export async function createDirectSaleAction(
  _previous: DirectSaleState,
  formData: FormData,
): Promise<DirectSaleState> {
  let sessionUser: AuthUser;
  try {
    sessionUser = await requireRole(ACCOUNTS_ROLES);
  } catch {
    return { ok: false, message: "Your session has expired. Please refresh the page and sign in again." };
  }

  const fullName = ((formData.get("fullName") as string) ?? "").trim();
  const nationalId = ((formData.get("nationalId") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const address = ((formData.get("address") as string) ?? "").trim();
  const developmentId = ((formData.get("developmentId") as string) ?? "").trim();
  const standId = ((formData.get("standId") as string) ?? "").trim();
  const depositAmount = parseFloat(formData.get("depositAmount") as string);
  const depositMethod = ((formData.get("depositMethod") as string) || "BANK_TRANSFER") as
    "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER";
  const depositReferenceInput = ((formData.get("depositReference") as string) ?? "").trim();
  const depositNotes = ((formData.get("depositNotes") as string) ?? "").trim() || undefined;
  const monthsOverrideRaw = ((formData.get("months") as string) ?? "").trim();
  const adminFee = parseFloat(formData.get("adminFee") as string) || 0;
  const adminFeeReference = ((formData.get("adminFeeReference") as string) ?? "").trim();

  if (fullName.length < 2) return directSaleFieldError("fullName", "Client name is required.");
  if (nationalId.length < 5) return directSaleFieldError("nationalId", "National ID is required.");
  if (phone.length < 7) return directSaleFieldError("phone", "Phone number is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return directSaleFieldError("email", "Enter a valid email address.");
  if (address.length < 5) return directSaleFieldError("address", "Physical address is required.");
  if (!developmentId) return directSaleFieldError("developmentId", "Choose a development.");
  if (!standId) return directSaleFieldError("standId", "Choose an available stand.");
  if (!depositAmount || depositAmount <= 0) return directSaleFieldError("depositAmount", "Enter a valid deposit amount.");
  if (!depositReferenceInput) return directSaleFieldError("depositReference", "Enter a deposit reference.");

  const reference = `DS-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    const setup = await db.transaction(async (tx) => {
      const [stand] = await tx
        .update(stands)
        .set({ status: "RESERVED", updatedAt: new Date() })
        .where(
          and(
            eq(stands.id, standId),
            eq(stands.developmentId, developmentId),
            eq(stands.status, "AVAILABLE"),
          ),
        )
        .returning();

      if (!stand) {
        return { ok: false as const, message: "That stand is no longer available. Pick another stand." };
      }

      const [development] = await tx
        .select()
        .from(developments)
        .where(eq(developments.id, developmentId))
        .limit(1);

      if (!development) {
        return { ok: false as const, message: "Development not found." };
      }

      let client = await tx.query.clients.findFirst({ where: eq(clients.email, email) });
      if (!client) {
        const [createdClient] = await tx
          .insert(clients)
          .values({ name: fullName, nationalId, phone, email, address })
          .returning();
        client = createdClient;
      } else {
        await tx
          .update(clients)
          .set({ name: fullName, nationalId, phone, address, updatedAt: new Date() })
          .where(eq(clients.id, client.id));
      }

      const [reservation] = await tx
        .insert(reservationsTable)
        .values({
          reference,
          clientId: client.id,
          agentId: null,
          developmentId,
          standId: stand.id,
          status: "APPROVED",
          message: "Direct sale by accounts",
        })
        .returning();

      return { ok: true as const, stand, development, client, reservation };
    });

    if (!setup.ok) return { ok: false, message: setup.message };

    const { stand, development, client, reservation } = setup;
    const months = monthsOverrideRaw
      ? Math.max(parseInt(monthsOverrideRaw, 10) || 1, 1)
      : development.paymentDurationMonths;

    const result = await buildSaleFromReservation({
      reservationId: reservation.id,
      clientId: client.id,
      clientEmail: client.email,
      clientName: client.name,
      agentId: null,
      agentEmail: null,
      commissionRate: "0",
      developmentId,
      developmentName: development.name,
      developmentDeposit: parseFloat(development.depositAmount),
      developmentInterest: development.interestRate,
      standId: stand.id,
      standNumber: stand.standNumber,
      standSizeSqm: stand.sizeSqm,
      reference,
      purchasePrice: parseFloat(stand.price),
      depositAmount,
      depositMethod,
      depositReference: depositReferenceInput,
      depositNotes,
      months,
      verifiedByUserId: sessionUser.id,
    });

    if (adminFee > 0) {
      await recordAdminFee({
        clientId: client.id,
        reservationId: reservation.id,
        saleId: result.saleId,
        method: depositMethod,
        amount: adminFee,
        reference: adminFeeReference || `ADM-${reference}`,
        verifiedByUserId: sessionUser.id,
      });
    }

    await auditLog({
      userId: sessionUser.id,
      action: "ACCOUNTS_DIRECT_SALE",
      module: "ACCOUNTS",
      newValue: { reference, saleNumber: result.saleNumber, clientEmail: email, developmentId, standId },
    });

    revalidatePath("/accounts");
    revalidatePath("/accounts/statements");
    revalidatePath("/admin");
    revalidatePath("/admin/stands");

    return {
      ok: true,
      saleNumber: result.saleNumber,
      message: `${result.saleNumber} created for ${fullName}. Stand ${stand.standNumber} at ${development.name} is now sold.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Could not create sale." };
  }
}

export async function createAgentPresaleAction(
  _previous: AgentPresaleState,
  formData: FormData,
): Promise<AgentPresaleState> {
  let sessionUser: AuthUser;
  try {
    sessionUser = await requireRole(AGENT_ROLES);
  } catch {
    return { ok: false, message: "Your session has expired. Please refresh the page and sign in again." };
  }
  const agentProfile = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, sessionUser.id),
  });

  if (!agentProfile) {
    return { ok: false, message: "Your agent profile is not active. Ask an administrator to finish your setup." };
  }

  const fullName = ((formData.get("fullName") as string) ?? "").trim();
  const nationalId = ((formData.get("nationalId") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const address = ((formData.get("address") as string) ?? "").trim();
  const developmentId = ((formData.get("developmentId") as string) ?? "").trim();
  const standId = ((formData.get("standId") as string) ?? "").trim();
  const notes = ((formData.get("notes") as string) ?? "").trim() || undefined;

  if (fullName.length < 2) return fieldError("fullName", "Client name is required.");
  if (nationalId.length < 5) return fieldError("nationalId", "National ID is required.");
  if (phone.length < 7) return fieldError("phone", "Phone number is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fieldError("email", "Enter a valid email address.");
  if (address.length < 5) return fieldError("address", "Physical address is required.");
  if (!developmentId) return fieldError("developmentId", "Choose a development.");
  if (!standId) return fieldError("standId", "Choose an available stand.");

  const reference = `PRE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    const result = await db.transaction(async (tx) => {
      const [stand] = await tx
        .update(stands)
        .set({ status: "RESERVED", updatedAt: new Date() })
        .where(
          and(
            eq(stands.id, standId),
            eq(stands.developmentId, developmentId),
            eq(stands.status, "AVAILABLE"),
          ),
        )
        .returning();

      if (!stand) {
        return { ok: false as const, message: "That stand is no longer available. Pick another stand." };
      }

      const [development] = await tx
        .select({ id: developments.id, name: developments.name })
        .from(developments)
        .where(eq(developments.id, developmentId))
        .limit(1);

      let client = await tx.query.clients.findFirst({ where: eq(clients.email, email) });
      if (!client) {
        const [createdClient] = await tx
          .insert(clients)
          .values({ name: fullName, nationalId, phone, email, address })
          .returning();
        client = createdClient;
      } else {
        await tx
          .update(clients)
          .set({ name: fullName, nationalId, phone, address, updatedAt: new Date() })
          .where(eq(clients.id, client.id));
      }

      await tx.insert(leads).values({
        clientId: client.id,
        agentId: agentProfile.id,
        developmentId,
        name: fullName,
        nationalId,
        phone,
        email,
        address,
        notes,
        source: "agent",
        status: "PRESALE_INITIATED",
      });

      await tx.insert(reservationsTable).values({
        reference,
        clientId: client.id,
        agentId: agentProfile.id,
        developmentId,
        standId: stand.id,
        status: "PRESALE",
        message: notes,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      return {
        ok: true as const,
        developmentName: development?.name ?? "the selected development",
        standNumber: stand.standNumber,
        standPrice: stand.price,
      };
    });

    if (!result.ok) return result;

    await auditLog({
      action: "AGENT_CREATE_PRESALE",
      module: "AGENT",
      newValue: {
        reference,
        agentId: agentProfile.id,
        clientEmail: email,
        developmentId,
        standId,
      },
    });

    const expiresLabel = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const priceLabel = `USD ${parseFloat(result.standPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    await Promise.all([
      sendNotification({
        recipient: email,
        subject: `Presale Confirmed — ${result.developmentName} Stand ${result.standNumber} (${reference})`,
        body: `Your reservation ${reference} at ${result.developmentName} Stand ${result.standNumber} is now in presale. Your agent will contact you with deposit instructions.`,
        html: presaleEmail({
          clientName: fullName,
          standNumber: result.standNumber,
          developmentName: result.developmentName,
          reference,
          agentName: sessionUser.name,
        }),
      }),
      sendNotification({
        recipient: sessionUser.email,
        subject: `New Presale Created — ${reference} (${result.developmentName} Stand ${result.standNumber})`,
        body: `Presale ${reference} created for ${fullName}. Stand ${result.standNumber} at ${result.developmentName}. Expires ${expiresLabel}.`,
        html: agentPresaleNotificationEmail({
          agentName: sessionUser.name,
          clientName: fullName,
          standNumber: result.standNumber,
          developmentName: result.developmentName,
          reference,
          price: priceLabel,
          expiresAt: expiresLabel,
        }),
      }),
      notifyAdminsOfPresale({
        reference,
        clientName: fullName,
        agentName: sessionUser.name,
        standNumber: result.standNumber,
        developmentName: result.developmentName,
        price: priceLabel,
        expiresAt: expiresLabel,
      }),
    ]);

    revalidatePath("/agent");
    revalidatePath("/agent/leads");
    revalidatePath("/agent/presales");
    revalidatePath("/admin/stands");

    return {
      ok: true,
      reference,
      message: `${reference} created for ${fullName}. Stand ${result.standNumber} at ${result.developmentName} is now held for presale.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Could not create presale." };
  }
}

export async function createAgentLeadAction(
  _previous: AgentLeadState,
  formData: FormData,
): Promise<AgentLeadState> {
  let sessionUser: AuthUser;
  try {
    sessionUser = await requireRole(AGENT_ROLES);
  } catch {
    return { ok: false, message: "Your session has expired. Please refresh the page and sign in again." };
  }
  const agentProfile = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, sessionUser.id),
  });

  if (!agentProfile) {
    return { ok: false, message: "Your agent profile is not active. Ask an administrator to finish your setup." };
  }

  const fullName = ((formData.get("fullName") as string) ?? "").trim();
  const nationalId = ((formData.get("nationalId") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const address = ((formData.get("address") as string) ?? "").trim();
  const developmentId = ((formData.get("developmentId") as string) ?? "").trim() || undefined;
  const notes = ((formData.get("notes") as string) ?? "").trim() || undefined;

  if (fullName.length < 2) return leadFieldError("fullName", "Client name is required.");
  if (nationalId.length < 5) return leadFieldError("nationalId", "National ID is required.");
  if (phone.length < 7) return leadFieldError("phone", "Phone number is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return leadFieldError("email", "Enter a valid email address.");
  if (address.length < 5) return leadFieldError("address", "Physical address is required.");

  try {
    await db.transaction(async (tx) => {
      let client = await tx.query.clients.findFirst({ where: eq(clients.email, email) });

      if (!client) {
        const [createdClient] = await tx
          .insert(clients)
          .values({ name: fullName, nationalId, phone, email, address })
          .returning();
        client = createdClient;
      } else {
        await tx
          .update(clients)
          .set({ name: fullName, nationalId, phone, address, updatedAt: new Date() })
          .where(eq(clients.id, client.id));
      }

      await tx.insert(leads).values({
        clientId: client.id,
        agentId: agentProfile.id,
        developmentId,
        name: fullName,
        nationalId,
        phone,
        email,
        address,
        notes,
        source: "agent",
        status: "NEW",
      });
    });

    await auditLog({
      action: "AGENT_CREATE_LEAD",
      module: "AGENT",
      newValue: {
        agentId: agentProfile.id,
        clientEmail: email,
        developmentId,
      },
    });

    revalidatePath("/agent");
    revalidatePath("/agent/leads");

    return {
      ok: true,
      message: `${fullName} has been added as a new lead.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Could not create lead." };
  }
}

export async function updateAgentClientInfoAction(
  _previous: AgentClientUpdateState,
  formData: FormData,
): Promise<AgentClientUpdateState> {
  try {
    await requireRole(AGENT_ROLES);
  } catch {
    return { ok: false, message: "Your session has expired. Please refresh the page and sign in again." };
  }

  const clientId = ((formData.get("clientId") as string) ?? "").trim();
  const name = ((formData.get("name") as string) ?? "").trim();
  const nationalId = ((formData.get("nationalId") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const address = ((formData.get("address") as string) ?? "").trim();
  const nationalIdFrontUrl = ((formData.get("nationalIdFrontUrl") as string) ?? "").trim() || null;
  const nationalIdBackUrl = ((formData.get("nationalIdBackUrl") as string) ?? "").trim() || null;
  const passportCopyUrl = ((formData.get("passportCopyUrl") as string) ?? "").trim() || null;
  const proofOfResidenceUrl = ((formData.get("proofOfResidenceUrl") as string) ?? "").trim() || null;
  const passportPhotoUrl = ((formData.get("passportPhotoUrl") as string) ?? "").trim() || null;
  const requestedKycStatus = ((formData.get("kycStatus") as string) ?? "").trim();

  if (!clientId) return clientFieldError("clientId", "Client is required.");
  if (name.length < 2) return clientFieldError("name", "Client name is required.");
  if (nationalId.length < 5) return clientFieldError("nationalId", "National ID is required.");
  if (phone.length < 7) return clientFieldError("phone", "Phone number is required.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return clientFieldError("email", "Enter a valid email address.");
  if (address.length < 5) return clientFieldError("address", "Physical address is required.");

  const documentUrls = [
    nationalIdFrontUrl,
    nationalIdBackUrl,
    passportCopyUrl,
    proofOfResidenceUrl,
    passportPhotoUrl,
  ];
  const hasDocuments = documentUrls.some(Boolean);
  const hasAllDocuments = documentUrls.every(Boolean);
  const autoKycStatus = hasAllDocuments ? "COMPLETE" : hasDocuments ? "IN_REVIEW" : "NOT_STARTED";
  const kycStatus = ["NOT_STARTED", "IN_REVIEW", "COMPLETE", "REJECTED"].includes(requestedKycStatus)
    ? requestedKycStatus as "NOT_STARTED" | "IN_REVIEW" | "COMPLETE" | "REJECTED"
    : autoKycStatus;

  try {
    await db
      .update(clients)
      .set({
        name,
        nationalId,
        phone,
        email,
        address,
        nationalIdFrontUrl,
        nationalIdBackUrl,
        passportCopyUrl,
        proofOfResidenceUrl,
        passportPhotoUrl,
        kycStatus,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId));

    await auditLog({
      action: "AGENT_UPDATE_CLIENT_INFO",
      module: "AGENT",
      newValue: { clientId, email, documents: documentUrls.filter(Boolean).length },
    });

    revalidatePath("/agent");
    revalidatePath("/agent/kyc");

    return { ok: true, message: "Client information and document links updated." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Could not update client information." };
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: "CONTACTED" | "INTERESTED" | "SITE_VISIT_BOOKED" | "NEGOTIATING" | "PRESALE_INITIATED" | "LOST",
) {
  await requireRole(AGENT_ROLES);
  await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await auditLog({
    action: "UPDATE_LEAD_STATUS",
    module: "LEAD",
    previousValue: { leadId },
    newValue: { status },
  });

  revalidatePath("/agent");
}

export async function updateReservationStatus(
  reservationId: string,
  status: "PRESALE" | "AWAITING_DEPOSIT",
) {
  const sessionUser = await requireRole(AGENT_ROLES);
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservationsTable.id, reservationId),
    with: { stand: true, development: true, client: true, agent: { with: { user: true } } },
  });

  if (!reservation) return;

  // Allow forward transitions only
  const allowed: Record<string, string[]> = {
    PENDING: ["PRESALE", "AWAITING_DEPOSIT"],
    PRESALE: ["AWAITING_DEPOSIT"],
  };

  const next = allowed[reservation.status];
  if (!next || !next.includes(status)) return;

  await db
    .update(reservationsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(reservationsTable.id, reservationId));

  // If moving to PRESALE, create reservation document + update lead status
  if (status === "PRESALE") {
    await db.insert(documents).values({
      type: "RESERVATION_FORM",
      title: `Reservation Form — ${reservation.reference}`,
      url: `/documents/${reservation.reference}-reservation.pdf`,
      developmentId: reservation.developmentId,
    });

    await db
      .update(leads)
      .set({ status: "PRESALE_INITIATED", updatedAt: new Date() })
      .where(
        and(
          eq(leads.clientId, reservation.clientId ?? ""),
          eq(leads.developmentId, reservation.developmentId),
          inArray(leads.status, ["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING"]),
        )
      );

    const agentName = reservation.agent?.user?.name ?? sessionUser.name;
    const agentEmail = reservation.agent?.user?.email ?? sessionUser.email;
    const expiresLabel = reservation.expiresAt
      ? new Date(reservation.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "N/A";
    const priceLabel = `USD ${parseFloat(reservation.stand.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    await Promise.all([
      sendNotification({
        recipient: reservation.client.email,
        subject: `Presale confirmed — ${reservation.development.name} Stand ${reservation.stand.standNumber} (${reservation.reference})`,
        body: `Your reservation ${reservation.reference} at ${reservation.development.name} has been advanced to Presale status.`,
        html: presaleEmail({
          clientName: reservation.client.name,
          standNumber: reservation.stand.standNumber,
          developmentName: reservation.development.name,
          reference: reservation.reference,
          agentName,
        }),
      }),
      sendNotification({
        recipient: agentEmail,
        subject: `Presale confirmed — ${reservation.reference} (${reservation.development.name} Stand ${reservation.stand.standNumber})`,
        body: `Presale ${reservation.reference} confirmed for ${reservation.client.name}. Stand ${reservation.stand.standNumber} at ${reservation.development.name}.`,
        html: agentPresaleNotificationEmail({
          agentName,
          clientName: reservation.client.name,
          standNumber: reservation.stand.standNumber,
          developmentName: reservation.development.name,
          reference: reservation.reference,
          price: priceLabel,
          expiresAt: expiresLabel,
        }),
      }),
      notifyAdminsOfPresale({
        reference: reservation.reference,
        clientName: reservation.client.name,
        agentName,
        standNumber: reservation.stand.standNumber,
        developmentName: reservation.development.name,
        price: priceLabel,
        expiresAt: expiresLabel,
      }),
    ]);
  }

  await auditLog({
    action: "UPDATE_RESERVATION_STATUS",
    module: "RESERVATION",
    previousValue: { status: reservation.status },
    newValue: { status, reservationId },
  });

  revalidatePath("/agent/presales");
  revalidatePath("/accounts");
}

async function notifyPaymentRecorded(params: {
  saleId: string;
  amount: number;
  reference: string;
  method: string;
  type: string;
  paidAt: Date;
  recordedBy: string;
}) {
  const fullSale = await db.query.sales.findFirst({
    where: eq(salesTable.id, params.saleId),
    with: { client: true, development: true, stand: true, agent: { with: { user: true } } },
  });
  if (!fullSale) return;

  const paidAtLabel = params.paidAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const notifData = {
    saleNumber: fullSale.saleNumber,
    clientName: fullSale.client?.name ?? "—",
    standNumber: fullSale.stand?.standNumber ?? "—",
    developmentName: fullSale.development?.name ?? "—",
    amount: params.amount,
    reference: params.reference,
    method: params.method,
    type: params.type,
    paidAt: paidAtLabel,
    outstandingBalance: parseFloat(fullSale.outstandingBalance),
  };

  const adminsAndCeo = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["ADMINISTRATOR", "SYSTEM_ADMIN", "ACCOUNTS", "CEO"]));

  const recipients = [...adminsAndCeo];
  if (fullSale.agent?.user?.email) {
    recipients.push({ name: fullSale.agent.user.name, email: fullSale.agent.user.email });
  }

  const tasks: Promise<unknown>[] = [];

  if (fullSale.client?.email) {
    tasks.push(
      sendNotification({
        recipient: fullSale.client.email,
        subject: `Payment Received — ${fullSale.saleNumber}`,
        body: `Payment of $${params.amount.toFixed(2)} received for ${fullSale.saleNumber}.`,
        html: installmentReceivedEmail({ ...notifData, clientName: fullSale.client.name }),
      }),
    );
  }

  for (const r of recipients.filter((r) => r.email?.includes("@"))) {
    tasks.push(
      sendNotification({
        recipient: r.email!,
        subject: `Payment Recorded — ${fullSale.saleNumber}`,
        body: `Payment of $${params.amount.toFixed(2)} recorded for ${fullSale.saleNumber} by ${params.recordedBy}.`,
        html: adminPaymentAlertEmail({
          ...notifData,
          adminName: r.name ?? "Team",
          recordedBy: params.recordedBy,
        }),
      }),
    );
  }

  await Promise.allSettled(tasks);
}

async function notifyAgentPaymentSubmission(params: {
  saleId: string;
  amount: number;
  type: string;
  reference: string;
  receiptNumber: string;
  method: string;
  submittedBy: string;
}) {
  const sale = await db.query.sales.findFirst({
    where: eq(salesTable.id, params.saleId),
    with: { client: true, development: true, stand: true },
  });
  if (!sale) return;

  const reviewers = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["ADMINISTRATOR", "SYSTEM_ADMIN", "ACCOUNTS", "CEO"]));

  const body = [
    `Agent payment submission awaiting verification.`,
    `Sale: ${sale.saleNumber}`,
    `Client: ${sale.client?.name ?? "—"}`,
    `Property: ${sale.development?.name ?? "—"}, stand ${sale.stand?.standNumber ?? "—"}`,
    `Payment type: ${params.type}`,
    `Amount: $${params.amount.toFixed(2)} via ${params.method.replace(/_/g, " ")}`,
    `Transaction reference: ${params.reference}`,
    `Receipt number: ${params.receiptNumber}`,
    `Submitted by: ${params.submittedBy}`,
  ].join("\n");

  await Promise.allSettled(
    reviewers
      .filter((reviewer) => reviewer.email?.includes("@"))
      .map((reviewer) => sendNotification({
        recipient: reviewer.email!,
        subject: `Payment submission awaiting review — ${sale.saleNumber}`,
        body,
      })),
  );
}

export async function verifyPayment(paymentId: string) {
  const sessionUser = await requireRole(ACCOUNTS_ROLES);
  const verifiedByUserId = sessionUser.id;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });
  if (!payment) throw new Error("Payment not found");

  let appliedToSale: { previousBalance: number; newBalance: number } | null = null;
  await db.transaction(async (tx) => {
    if (payment.status !== "VERIFIED" && payment.saleId && (payment.type === "INSTALLMENT" || payment.type === "DEPOSIT")) {
      appliedToSale = await applyPropertyPaymentToSale(
        tx,
        payment.saleId,
        parseFloat(payment.amount),
        payment.paidAt,
        { isDeposit: payment.type === "DEPOSIT" },
      );
    }

    await tx
      .update(payments)
      .set({ status: "VERIFIED", verifiedByUserId })
      .where(eq(payments.id, paymentId));
  });

  await auditLog({
    action: "VERIFY_PAYMENT",
    module: "ACCOUNTS",
    newValue: { paymentId, verifiedByUserId, appliedToSale },
  });

  if (payment.status !== "VERIFIED" && payment.saleId) {
    const typeLabel = paymentTypeLabel(payment.type);
    await notifyPaymentRecorded({
      saleId: payment.saleId,
      amount: parseFloat(payment.amount),
      reference: payment.reference,
      method: payment.method,
      type: typeLabel,
      paidAt: payment.paidAt,
      recordedBy: sessionUser.name ?? sessionUser.email ?? "System",
    });
  }

  revalidatePath("/accounts");
  revalidatePath("/accounts/payments");
  revalidatePath(`/accounts/statements/${payment.saleId ?? ""}`);
  revalidatePath("/client/statements");
}

export async function rejectPayment(paymentId: string) {
  const sessionUser = await requireRole(ACCOUNTS_ROLES);
  const verifiedByUserId = sessionUser.id;

  await db
    .update(payments)
    .set({ status: "FAILED", verifiedByUserId })
    .where(eq(payments.id, paymentId));

  await auditLog({
    action: "REJECT_PAYMENT",
    module: "ACCOUNTS",
    newValue: { paymentId, verifiedByUserId },
  });

  revalidatePath("/accounts");
  revalidatePath("/accounts/payments");
}

export async function rejectReservation(reservationId: string) {
  await requireRole(ACCOUNTS_ROLES);
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservationsTable.id, reservationId),
    with: { stand: true },
  });

  if (!reservation || (reservation.status !== "AWAITING_DEPOSIT" && reservation.status !== "PRESALE")) {
    return;
  }

  // Cancel the reservation
  await db
    .update(reservationsTable)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(reservationsTable.id, reservationId));

  // Release the stand back to available
  await db
    .update(stands)
    .set({ status: "AVAILABLE", updatedAt: new Date() })
    .where(eq(stands.id, reservation.standId));

  // Update matching leads that are still in active pre-sale pipeline states
  await db
    .update(leads)
    .set({ status: "LOST", updatedAt: new Date() })
    .where(
      and(
        eq(leads.clientId, reservation.clientId),
        eq(leads.developmentId, reservation.developmentId),
        eq(leads.status, "PRESALE_INITIATED"),
      )
    );

  await auditLog({
    action: "REJECT_RESERVATION",
    module: "ACCOUNTS",
    previousValue: { reservationStatus: reservation.status },
    newValue: { reservationStatus: "CANCELLED", standStatus: "AVAILABLE" },
  });

  revalidatePath("/accounts");
}

// ─── Admin: approve or cancel any reservation ────────────────────────────

export async function adminUpdateReservationStatus(
  reservationId: string,
  status: "PENDING" | "PRESALE" | "AWAITING_DEPOSIT" | "APPROVED" | "CANCELLED" | "EXPIRED",
) {
  await requireRole(ADMIN_ROLES);
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservationsTable.id, reservationId),
    with: { stand: true, development: true, client: true, agent: { with: { user: true } } },
  });
  if (!reservation) return;

  await db
    .update(reservationsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(reservationsTable.id, reservationId));

  if (status === "CANCELLED" || status === "EXPIRED") {
    await db
      .update(stands)
      .set({ status: "AVAILABLE", updatedAt: new Date() })
      .where(eq(stands.id, reservation.standId));
  }

  if (status === "PRESALE") {
    const agentName = reservation.agent?.user?.name ?? "Your agent";
    const agentEmail = reservation.agent?.user?.email;
    const expiresLabel = reservation.expiresAt
      ? new Date(reservation.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "N/A";

    const notifications: Promise<unknown>[] = [
      sendNotification({
        recipient: reservation.client.email,
        subject: `Presale confirmed — ${reservation.development.name} Stand ${reservation.stand.standNumber} (${reservation.reference})`,
        body: `Your reservation ${reservation.reference} has been advanced to Presale status.`,
        html: presaleEmail({
          clientName: reservation.client.name,
          standNumber: reservation.stand.standNumber,
          developmentName: reservation.development.name,
          reference: reservation.reference,
          agentName,
        }),
      }),
    ];

    const priceLabel = `USD ${parseFloat(reservation.stand.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    if (agentEmail) {
      notifications.push(
        sendNotification({
          recipient: agentEmail,
          subject: `Presale confirmed — ${reservation.reference} (${reservation.development.name} Stand ${reservation.stand.standNumber})`,
          body: `Presale ${reservation.reference} for ${reservation.client.name} has been confirmed by admin.`,
          html: agentPresaleNotificationEmail({
            agentName,
            clientName: reservation.client.name,
            standNumber: reservation.stand.standNumber,
            developmentName: reservation.development.name,
            reference: reservation.reference,
            price: priceLabel,
            expiresAt: expiresLabel,
          }),
        }),
      );
    }

    notifications.push(
      notifyAdminsOfPresale({
        reference: reservation.reference,
        clientName: reservation.client.name,
        agentName,
        standNumber: reservation.stand.standNumber,
        developmentName: reservation.development.name,
        price: priceLabel,
        expiresAt: expiresLabel,
      }),
    );

    await Promise.all(notifications);
  }

  await auditLog({
    action: "ADMIN_UPDATE_RESERVATION",
    module: "ADMIN",
    previousValue: { status: reservation.status },
    newValue: { status },
  });

  revalidatePath("/admin/reservations");
}

// ─── Email installment revenue report ───────────────────────────────────

export async function emailInstallmentRevenueReport(_formData?: FormData) { // eslint-disable-line @typescript-eslint/no-unused-vars
  await requireRole(ACCOUNTS_ROLES);
  const [revenueQueries, devQueries, { generateInstallmentRevenuePdf }] = await Promise.all([
    import("@/lib/db/queries/revenue"),
    import("@/lib/db/queries/developments"),
    import("@/lib/documents"),
  ]);

  const { getCollectedInstallmentRevenue, getInstallmentRevenueSummary } = revenueQueries;
  const { getAllDevelopmentsWithStandCounts } = devQueries;

  // Fetch report data
  const [summary, collected, devs] = await Promise.all([
    getInstallmentRevenueSummary(),
    getCollectedInstallmentRevenue(),
    getAllDevelopmentsWithStandCounts(),
  ]);

  // Generate PDF
  const pdfBuffer = await generateInstallmentRevenuePdf({ summary, collected, developments: devs });
  const pdfUint8 = new Uint8Array(pdfBuffer);

  // Find authorized recipients (roles that should receive financial reports)
  const authorizedRoles: (typeof users.$inferSelect.role)[] = ["ACCOUNTS", "CEO", "ADMINISTRATOR", "SYSTEM_ADMIN"];
  const recipients = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, authorizedRoles));

  if (recipients.length === 0) {
    revalidatePath("/accounts/revenue");
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `installment-revenue-${dateStr}.pdf`;

  // Send to each recipient individually
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendNotification({
        recipient: r.email,
        subject: `Installment Revenue Report — ${dateStr}`,
        body: `Hi ${r.name},

Please find attached the Installment Revenue Report generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.

This report includes:
• Installment revenue collected vs expected
• Monthly breakdown by development
• Collection rate and active installment plans

	Amata Properties — Automated Report`,
        attachment: { filename, content: pdfUint8 },
      }),
    ),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Audit log
  await auditLog({
    action: "EMAIL_REPORT",
    module: "ACCOUNTS",
    newValue: {
      reportType: "installment-revenue",
      recipients: recipients.length,
      succeeded,
      failed,
    },
  });

  revalidatePath("/accounts/revenue");
}


export async function updateUserProfile(userId: string, formData: FormData) {
  await requireRole(ADMIN_ROLES);
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!name || !email) return;

  await db
    .update(users)
    .set({ name, email, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await auditLog({
    action: "UPDATE_USER_PROFILE",
    module: "ADMIN",
    newValue: { userId, name, email },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  await requireRole(ADMIN_ROLES);
  // Nullify FK references that don't have ON DELETE CASCADE
  await db.update(clients).set({ userId: null }).where(eq(clients.userId, userId));
  await db.update(auditLogs).set({ userId: null }).where(eq(auditLogs.userId, userId));

  // Nullify FK references to the agent profile, then delete it
  const agentProfile = await db.query.agentProfiles.findFirst({
    where: eq(agentProfiles.userId, userId),
  });
  if (agentProfile) {
    await Promise.all([
      db.update(leads).set({ agentId: null }).where(eq(leads.agentId, agentProfile.id)),
      db.update(reservationsTable).set({ agentId: null }).where(eq(reservationsTable.agentId, agentProfile.id)),
      db.update(salesTable).set({ agentId: null }).where(eq(salesTable.agentId, agentProfile.id)),
    ]);
    await db.delete(agentProfiles).where(eq(agentProfiles.id, agentProfile.id));
  }

  // Cascade deletes: sessions, accounts
  await db.delete(users).where(eq(users.id, userId));

  await auditLog({
    action: "DELETE_USER",
    module: "ADMIN",
    newValue: { userId },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/sysadmin/users");
  revalidatePath("/sysadmin");
}

export async function createUserAccount(
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sessionUser = await requireRole(ADMIN_ROLES);
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as string;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const password = formData.get("password") as string;

  if (!name || !email || !password || password.length < 8) {
    return { ok: false, error: "Name, email, and password (min 8 characters with a mix of letters, numbers, and symbols) are required." };
  }

  const validRoles = ["PUBLIC", "CLIENT", "AGENT", "ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN", "GROUP_ADMIN"];
  if (!validRoles.includes(role)) {
    return { ok: false, error: "Invalid role selected." };
  }
  if (role === "SYSTEM_ADMIN" && sessionUser.role !== "SYSTEM_ADMIN") {
    return { ok: false, error: "Only system administrators can create system administrator accounts." };
  }

  // Check if email already exists
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { ok: false, error: "A user with this email address already exists." };
  }

  try {
    const { hashPassword } = await import("@/lib/password");
    const hashed = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({ name, email, emailVerified: true, role: role as "PUBLIC" | "CLIENT" | "AGENT" | "ACCOUNTS" | "ADMINISTRATOR" | "CEO" | "SYSTEM_ADMIN" | "GROUP_ADMIN", phone })
      .returning({ id: users.id });

    if (role === "AGENT") {
      await ensureAgentProfile(user.id);
    }

    await db.insert(accounts).values({
      userId: user.id,
      accountId: email,
      providerId: "email",
      password: hashed,
    });

    await auditLog({
      action: "CREATE_USER",
      module: "ADMIN",
      newValue: { name, email, role },
    });

    // Send welcome/invite email
    sendNotification({
      recipient: email,
      subject: "Welcome to Amata Properties — your account is ready",
      body: `Hi ${name}, your Amata Properties account has been created. Email: ${email}. Please sign in and change your password.`,
      html: inviteEmail({ name, email, password, role }),
    }).catch(() => {/* non-blocking */});

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user.";
    return { ok: false, error: message };
  }
}

export async function inviteUserAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sessionUser = await requireRole(ADMIN_ROLES);
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as string;
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name || !email) {
    return { ok: false, error: "Name and email are required." };
  }

  const validRoles = ["PUBLIC", "CLIENT", "AGENT", "ACCOUNTS", "ADMINISTRATOR", "CEO", "SYSTEM_ADMIN", "GROUP_ADMIN"];
  if (!validRoles.includes(role)) {
    return { ok: false, error: "Invalid role selected." };
  }
  if (role === "SYSTEM_ADMIN" && sessionUser.role !== "SYSTEM_ADMIN") {
    return { ok: false, error: "Only system administrators can invite system administrator accounts." };
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { ok: false, error: "A user with this email address already exists." };
  }

  try {
    const [user] = await db
      .insert(users)
      .values({ name, email, emailVerified: false, role: role as "PUBLIC" | "CLIENT" | "AGENT" | "ACCOUNTS" | "ADMINISTRATOR" | "CEO" | "SYSTEM_ADMIN" | "GROUP_ADMIN", phone })
      .returning({ id: users.id });

    if (role === "AGENT") {
      await ensureAgentProfile(user.id);
    }

    await db.insert(accounts).values({
      userId: user.id,
      accountId: email,
      providerId: "email",
      password: null,
    });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.insert(verifications).values({
      identifier: `password-reset:${email}`,
      value: token,
      expiresAt,
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.amataproperties.com"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    sendNotification({
      recipient: email,
      subject: "You've been invited to Amata Properties",
      body: `Hi ${name}, you've been invited to Amata Properties. Set up your account here: ${inviteLink} (expires in 7 days)`,
      html: inviteWithLinkEmail({ name, email, role, inviteLink }),
    }).catch(() => {/* non-blocking */});

    await auditLog({
      action: "INVITE_USER",
      module: "ADMIN",
      newValue: { name, email, role },
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to invite user.";
    return { ok: false, error: message };
  }
}

export async function updateStandStatus(id: string, status: "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED") {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ standNumber: stands.standNumber, status: stands.status, developmentId: stands.developmentId })
    .from(stands)
    .where(eq(stands.id, id));
  await db.update(stands).set({ status, updatedAt: new Date() }).where(eq(stands.id, id));
  await auditLog({
    action: "UPDATE_STAND_STATUS",
    module: "STANDS",
    previousValue: prev,
    newValue: { standId: id, newStatus: status },
  });
  revalidatePath("/admin/stands");
  revalidatePath("/agent/restrictions");
  revalidatePath("/admin");
}

export async function toggleDevelopmentActive(id: string, active: boolean) {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ name: developments.name, active: developments.active })
    .from(developments)
    .where(eq(developments.id, id));
  await db.update(developments).set({ active, updatedAt: new Date() }).where(eq(developments.id, id));
  await auditLog({
    action: "TOGGLE_DEVELOPMENT_ACTIVE",
    module: "DEVELOPMENT",
    previousValue: prev,
    newValue: { developmentId: id, active },
  });
  revalidatePath("/admin/developments");
  revalidatePath("/admin");
}

// ─── Development archive / soft-delete / restore / duplicate ────────────

export async function archiveDevelopmentAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ name: developments.name, archivedAt: developments.archivedAt })
    .from(developments)
    .where(eq(developments.id, id));
  if (!prev) return { ok: false, error: "Development not found." };

  await db.update(developments).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(developments.id, id));
  await auditLog({
    action: "ARCHIVE_DEVELOPMENT",
    module: "DEVELOPMENT",
    previousValue: prev,
    newValue: { developmentId: id },
  });
  revalidatePath("/admin/developments");
  revalidatePath("/");
  return { ok: true };
}

export async function restoreDevelopmentAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const [prev] = await db
    .select({ name: developments.name, archivedAt: developments.archivedAt, deletedAt: developments.deletedAt })
    .from(developments)
    .where(eq(developments.id, id));
  if (!prev) return { ok: false, error: "Development not found." };

  await db.update(developments).set({ archivedAt: null, deletedAt: null, updatedAt: new Date() }).where(eq(developments.id, id));
  await auditLog({
    action: "RESTORE_DEVELOPMENT",
    module: "DEVELOPMENT",
    previousValue: prev,
    newValue: { developmentId: id },
  });
  revalidatePath("/admin/developments");
  revalidatePath("/");
  return { ok: true };
}

export async function softDeleteDevelopmentAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const dev = await db.query.developments.findFirst({ where: eq(developments.id, id), with: { stands: true } });
  if (!dev) return { ok: false, error: "Development not found." };

  const encumberedStands = dev.stands.filter((s) => s.status === "SOLD" || s.status === "RESERVED");
  if (encumberedStands.length > 0) {
    return {
      ok: false,
      error: `Cannot delete: ${encumberedStands.length} stand(s) are SOLD or RESERVED. Archive this development instead, or resolve those stands first.`,
    };
  }
  const [activeSale] = await db
    .select({ id: salesTable.id })
    .from(salesTable)
    .where(and(eq(salesTable.developmentId, id), eq(salesTable.status, "ACTIVE")))
    .limit(1);
  if (activeSale) {
    return { ok: false, error: "Cannot delete: this development still has an ACTIVE sale. Archive it instead." };
  }

  await db.update(developments).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(developments.id, id));
  await auditLog({
    action: "SOFT_DELETE_DEVELOPMENT",
    module: "DEVELOPMENT",
    previousValue: { name: dev.name },
    newValue: { developmentId: id },
  });
  revalidatePath("/admin/developments");
  revalidatePath("/");
  return { ok: true };
}

export async function duplicateDevelopmentAction(id: string): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const source = await db.query.developments.findFirst({ where: eq(developments.id, id) });
  if (!source) return { ok: false, error: "Development not found." };

  let slug = `${source.slug}-copy`;
  let suffix = 2;
  while (await db.query.developments.findFirst({ where: eq(developments.slug, slug) })) {
    slug = `${source.slug}-copy-${suffix}`;
    suffix++;
  }

  const [copy] = await db
    .insert(developments)
    .values({
      slug,
      name: `${source.name} (Copy)`,
      location: source.location,
      province: source.province,
      description: source.description,
      developerName: source.developerName,
      developerContact: source.developerContact,
      startingPrice: source.startingPrice,
      pricePerSqm: source.pricePerSqm,
      depositAmount: source.depositAmount,
      interestRate: source.interestRate,
      paymentDurationMonths: source.paymentDurationMonths,
      paymentTerms: source.paymentTerms,
      termsAndConditions: source.termsAndConditions,
      amenities: source.amenities,
      infrastructureStatus: source.infrastructureStatus,
      heroImage: source.heroImage,
      gallery: source.gallery,
      brochureUrl: source.brochureUrl,
      geoJson: source.geoJson,
      active: false,
    })
    .returning();

  await auditLog({
    action: "DUPLICATE_DEVELOPMENT",
    module: "DEVELOPMENT",
    previousValue: { sourceId: id, sourceName: source.name },
    newValue: { newId: copy.id, newSlug: copy.slug },
  });
  revalidatePath("/admin/developments");
  return { ok: true, slug: copy.slug };
}

function parseJsonField<T>(formData: FormData, key: string): T | null {
  const raw = formData.get(key) as string | null;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function createDevelopmentAction(
  formData: FormData
): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  // ── Validate required fields ────────────────────────────────────────────
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { ok: false, error: "Development name is required." };

  const location = (formData.get("location") as string)?.trim();
  if (!location) return { ok: false, error: "Location is required." };

  const province = formData.get("province") as string;
  const description = (formData.get("description") as string)?.trim();
  if (!description) return { ok: false, error: "Description is required." };

  const developerName = (formData.get("developerName") as string)?.trim();
  if (!developerName) return { ok: false, error: "Developer name is required." };

  const developerContact = (formData.get("developerContact") as string)?.trim();
  if (!developerContact) return { ok: false, error: "Developer contact is required." };

  const startingPrice = formData.get("startingPrice") as string;
  if (!startingPrice || isNaN(parseFloat(startingPrice)))
    return { ok: false, error: "A valid starting price is required." };

  const pricePerSqm = formData.get("pricePerSqm") as string;
  if (!pricePerSqm || isNaN(parseFloat(pricePerSqm)))
    return { ok: false, error: "A valid price per sqm is required." };

  const depositAmount = formData.get("depositAmount") as string;
  if (!depositAmount || isNaN(parseFloat(depositAmount)))
    return { ok: false, error: "A valid deposit amount is required." };

  const paymentDurationMonths = parseInt(
    formData.get("paymentDurationMonths") as string,
    10
  );
  if (!paymentDurationMonths || paymentDurationMonths < 1)
    return { ok: false, error: "Payment duration must be at least 1 month." };

  const paymentTerms = (formData.get("paymentTerms") as string)?.trim();
  if (!paymentTerms) return { ok: false, error: "Payment terms are required." };

  const termsAndConditions = (formData.get("termsAndConditions") as string)?.trim();
  if (!termsAndConditions)
    return { ok: false, error: "Terms and conditions are required." };

  const infrastructureStatus = formData.get("infrastructureStatus") as string;

  // ── Slug sanitization + uniqueness check ────────────────────────────────
  const rawSlug = (formData.get("slug") as string) || name;
  const slug = rawSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) return { ok: false, error: "A valid URL slug is required." };

  const existing = await db.query.developments.findFirst({
    where: eq(developments.slug, slug),
  });
  if (existing)
    return {
      ok: false,
      error: `The slug "${slug}" is already taken by "${existing.name}". Please use a different name or slug.`,
    };

  // ── Amenities ───────────────────────────────────────────────────────────
  const amenitiesRaw = formData.get("amenities") as string;
  const amenities = amenitiesRaw
    ? amenitiesRaw.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  // ── Insert development ──────────────────────────────────────────────────
  try {
    const publishFlag = formData.get("publish") as string | null;
    const latitudeRaw = formData.get("latitude") as string | null;
    const longitudeRaw = formData.get("longitude") as string | null;
    const reservationFeeRaw = formData.get("reservationFeeAmount") as string | null;

    const [dev] = await db
      .insert(developments)
      .values({
        slug,
        name,
        location,
        province,
        description,
        developerName,
        developerContact,
        startingPrice,
        pricePerSqm,
        depositAmount,
        interestRate: (formData.get("interestRate") as string) || "0",
        paymentDurationMonths,
        paymentTerms,
        termsAndConditions,
        amenities,
        infrastructureStatus,
        heroImage: (formData.get("heroImage") as string) || "/placeholder.jpg",
        active: publishFlag === "false" ? false : true,
        developmentType: (formData.get("developmentType") as string)?.trim() || null,
        currency: (formData.get("currency") as string)?.trim() || "USD",
        latitude: latitudeRaw && !isNaN(parseFloat(latitudeRaw)) ? latitudeRaw : null,
        longitude: longitudeRaw && !isNaN(parseFloat(longitudeRaw)) ? longitudeRaw : null,
        depositType: (formData.get("depositType") as string) || "fixed",
        installmentOptions: parseJsonField(formData, "installmentOptions") ?? [],
        penaltyRules: parseJsonField(formData, "penaltyRules"),
        reservationFeeAmount: reservationFeeRaw && !isNaN(parseFloat(reservationFeeRaw)) ? reservationFeeRaw : null,
        commissionRules: parseJsonField(formData, "commissionRules"),
        discountRules: parseJsonField(formData, "discountRules"),
        standNumberPrefix: (formData.get("standNumberPrefix") as string)?.trim() || null,
        standNumberAutoIncrement: (formData.get("standNumberAutoIncrement") as string) !== "false",
      })
      .returning();

    // ── Bulk stand creation ───────────────────────────────────────────────
    const standCount = parseInt(formData.get("standCount") as string || "0", 10);
    if (standCount > 0 && dev) {
      const prefix =
        (formData.get("standPrefix") as string) || slug.toUpperCase().slice(0, 3);
      const startNum = parseInt(
        formData.get("standStartNum") as string || "1",
        10
      );
      const sizeSqm = parseInt(
        formData.get("standSizeSqm") as string || "300",
        10
      );
      const price = (formData.get("standPrice") as string) || startingPrice;
      const phase = (formData.get("standPhase") as string) || "Phase 1";

      const standRows = Array.from({ length: standCount }).map((_, i) => ({
        developmentId: dev.id,
        standNumber: `${prefix}-${String(startNum + i).padStart(3, "0")}`,
        sizeSqm,
        price,
        phase,
      }));

      await db.insert(stands).values(standRows);
    }

    // ── Audit trail ───────────────────────────────────────────────────────
    await auditLog({
      action: "CREATE",
      module: "DEVELOPMENT",
      newValue: {
        name,
        slug,
        location,
        province,
        standCount,
        startingPrice,
      },
    });

    revalidatePath("/admin/developments");
    revalidatePath("/admin");
    return { ok: true, id: dev.id, slug: dev.slug };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred while creating the development.";
    return { ok: false, error: message };
  }
}

export async function updateDevelopmentAction(
  id: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { ok: false, error: "Development name is required." };

  const location = (formData.get("location") as string)?.trim();
  if (!location) return { ok: false, error: "Location is required." };

  const startingPrice = formData.get("startingPrice") as string;
  if (!startingPrice || isNaN(parseFloat(startingPrice)))
    return { ok: false, error: "A valid starting price is required." };

  const amenitiesRaw = formData.get("amenities") as string;
  const amenities = amenitiesRaw
    ? amenitiesRaw.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  // Handle GeoJSON upload (sent as a JSON string in the geoJson form field)
  const geoJsonRaw = formData.get("geoJson") as string;
  let geoJson: unknown = undefined;
  if (geoJsonRaw) {
    try {
      geoJson = JSON.parse(geoJsonRaw);
    } catch {
      return { ok: false, error: "Invalid GeoJSON format. Please upload a valid GeoJSON file." };
    }
  }

  try {
    const updateData: Record<string, unknown> = {
      name,
      location,
      province: formData.get("province") as string,
      description: (formData.get("description") as string)?.trim(),
      developerName: (formData.get("developerName") as string)?.trim(),
      developerContact: (formData.get("developerContact") as string)?.trim(),
      startingPrice,
      pricePerSqm: formData.get("pricePerSqm") as string,
      depositAmount: formData.get("depositAmount") as string,
      interestRate: (formData.get("interestRate") as string) || "0",
      paymentDurationMonths: parseInt(formData.get("paymentDurationMonths") as string || "24", 10),
      paymentTerms: (formData.get("paymentTerms") as string)?.trim(),
      termsAndConditions: (formData.get("termsAndConditions") as string)?.trim(),
      infrastructureStatus: formData.get("infrastructureStatus") as string,
      heroImage: (formData.get("heroImage") as string) || "/placeholder.jpg",
      gallery: (() => {
        try { return JSON.parse((formData.get("gallery") as string) || "[]") as string[]; } catch { return []; }
      })(),
      amenities,
      brochureUrl: (formData.get("brochureUrl") as string)?.trim() || null,
      updatedAt: new Date(),
    };

    // Only set geoJson if a new file was uploaded
    if (geoJsonRaw && geoJson !== undefined) {
      updateData.geoJson = geoJson;
    }

    await db
      .update(developments)
      .set(updateData)
      .where(eq(developments.id, id));

    await auditLog({
      action: "UPDATE",
      module: "DEVELOPMENT",
      newValue: { id, name, location, startingPrice },
    });

    revalidatePath("/sysadmin/developments");
    revalidatePath("/admin/developments");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { ok: false, error: message };
  }
}

// ─── Bulk reprice all AVAILABLE stands in a development ────────────────

export async function repriceAvailableStandsAction(
  developmentId: string,
  formData: FormData,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);

  const newPricePerSqm = parseFloat(formData.get("pricePerSqm") as string);
  if (!newPricePerSqm || newPricePerSqm <= 0) {
    return { ok: false, error: "A valid price per sqm is required." };
  }
  const newDepositAmount = formData.get("depositAmount") as string;
  const notifyTeam = formData.get("notifyTeam") === "on";

  const dev = await db.query.developments.findFirst({ where: eq(developments.id, developmentId) });
  if (!dev) return { ok: false, error: "Development not found." };

  const oldPricePerSqm = parseFloat(dev.pricePerSqm);
  const oldDeposit = parseFloat(dev.depositAmount);

  const availableStands = await db.query.stands.findMany({
    where: and(eq(stands.developmentId, developmentId), eq(stands.status, "AVAILABLE")),
  });

  await db.transaction(async (tx) => {
    await tx
      .update(developments)
      .set({
        pricePerSqm: newPricePerSqm.toFixed(2),
        ...(newDepositAmount ? { depositAmount: newDepositAmount } : {}),
        updatedAt: new Date(),
      })
      .where(eq(developments.id, developmentId));

    for (const s of availableStands) {
      const newPrice = (s.sizeSqm * newPricePerSqm).toFixed(2);
      await tx.update(stands).set({ price: newPrice, updatedAt: new Date() }).where(eq(stands.id, s.id));
    }
  });

  await auditLog({
    action: "BULK_REPRICE",
    module: "DEVELOPMENT",
    previousValue: { pricePerSqm: dev.pricePerSqm, depositAmount: dev.depositAmount },
    newValue: { pricePerSqm: newPricePerSqm, depositAmount: newDepositAmount || dev.depositAmount, standsRepriced: availableStands.length },
  });

  if (notifyTeam) {
    const { priceUpdateEmail } = await import("@/lib/email-templates");
    const recipients = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.role, ["AGENT", "ADMINISTRATOR", "SYSTEM_ADMIN", "CEO"]));

    await Promise.allSettled(
      recipients
        .filter((r) => r.email?.includes("@"))
        .map((r) =>
          sendNotification({
            recipient: r.email,
            subject: `Price Update: ${dev.name} — New Rates Effective Immediately`,
            body: `Price update for ${dev.name}: price per sqm $${oldPricePerSqm} -> $${newPricePerSqm}, deposit $${oldDeposit} -> $${newDepositAmount || oldDeposit}. Effective immediately for unsold/unreserved stands.`,
            html: priceUpdateEmail({
              recipientName: r.name,
              developmentName: dev.name,
              oldPricePerSqm,
              newPricePerSqm,
              oldDeposit,
              newDeposit: newDepositAmount ? parseFloat(newDepositAmount) : oldDeposit,
            }),
          }),
        ),
    );
  }

  revalidatePath("/sysadmin/developments");
  revalidatePath(`/sysadmin/developments/${dev.slug}`);
  revalidatePath(`/developments/${dev.slug}`);
  revalidatePath("/admin/developments");
  return { ok: true, count: availableStands.length };
}

export async function updateDevelopmentGeoJsonAction(
  id: string,
  geoJson: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(geoJson);
    // Basic GeoJSON validation: must have a valid type
    const validTypes = ["FeatureCollection", "Feature", "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"];
    if (!parsed.type || !validTypes.includes(String(parsed.type))) {
      return { ok: false, error: "Invalid GeoJSON format. The file must contain valid GeoJSON with a recognized geometry type." };
    }
  } catch {
    return { ok: false, error: "Invalid GeoJSON format. Please upload a valid .geojson file." };
  }

  try {
    await db
      .update(developments)
      .set({ geoJson: parsed, updatedAt: new Date() })
      .where(eq(developments.id, id));

    await auditLog({
      action: "UPDATE",
      module: "DEVELOPMENT",
      newValue: { id, action: "upload-geojson" },
    });

    revalidatePath("/");
    revalidatePath("/sysadmin/developments");
    revalidatePath("/admin/developments");

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save GeoJSON data.";
    return { ok: false, error: message };
  }
}

export async function createStandsAction(formData: FormData) {
  await requireRole(ADMIN_ROLES);
  const developmentId = formData.get("developmentId") as string;
  const mode = formData.get("mode") as string;
  const sizeSqm = parseInt(formData.get("sizeSqm") as string || "300", 10);
  const price = formData.get("price") as string;
  const phase = (formData.get("phase") as string) || "Phase 1";

  if (!developmentId || !price) {
    return { ok: false, error: "Missing required fields" };
  }

  let standRows: { developmentId: string; standNumber: string; sizeSqm: number; price: string; phase: string }[];

  if (mode === "custom") {
    const numbersRaw = formData.get("customNumbers") as string;
    if (!numbersRaw) {
      return { ok: false, error: "Enter at least one stand number" };
    }
    const numbers = numbersRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (numbers.length === 0) {
      return { ok: false, error: "Enter at least one stand number" };
    }
    standRows = numbers.map((n) => ({
      developmentId,
      standNumber: n,
      sizeSqm,
      price,
      phase,
    }));
  } else {
    const prefix = formData.get("prefix") as string;
    const startNum = parseInt(formData.get("startNum") as string || "1", 10);
    const count = parseInt(formData.get("count") as string || "0", 10);

    if (!prefix || count < 1) {
      return { ok: false, error: "Prefix and count are required for auto-generate mode" };
    }
    standRows = Array.from({ length: count }).map((_, i) => ({
      developmentId,
      standNumber: `${prefix}-${String(startNum + i).padStart(3, "0")}`,
      sizeSqm,
      price,
      phase,
    }));
  }

  await db.insert(stands).values(standRows);
  await auditLog({
    action: "CREATE_STANDS",
    module: "STANDS",
    newValue: { developmentId, count: standRows.length, mode, price, phase },
  });
  revalidatePath("/admin/stands");
  revalidatePath("/admin/developments");
  return { ok: true };
}

export type BulkStandImportRow = {
  standNumber: string;
  sizeSqm: string;
  price: string;
  section?: string;
  phase?: string;
  block?: string;
  road?: string;
  coordinates?: string;
  status?: string;
  notes?: string;
};

/**
 * Bulk stand import from Phase 2's onboarding wizard (CSV/manual entry, already
 * validated client-side). Modeled on bulkInstallmentUploadAction's shape:
 * per-row try/catch, returns {...row, ok, message}[] for the client to render.
 * `atomic` wraps the whole batch in one transaction (checkbox in the wizard);
 * otherwise rows commit independently and partial success is reported.
 */
export async function bulkImportStandsAction(
  developmentId: string,
  formData: FormData,
): Promise<{ ok: true; results: (BulkStandImportRow & { ok: boolean; message: string })[] } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const rowsJson = formData.get("rows") as string;
  const atomic = formData.get("atomic") === "on";
  const importBatchId = crypto.randomUUID();

  let rows: BulkStandImportRow[];
  try {
    rows = JSON.parse(rowsJson ?? "[]");
  } catch {
    return { ok: false, error: "Invalid import data." };
  }
  if (rows.length === 0) return { ok: false, error: "No rows to import." };

  const existing = await db.query.stands.findMany({
    where: eq(stands.developmentId, developmentId),
    columns: { standNumber: true },
  });
  const existingNumbers = new Set(existing.map((s) => s.standNumber));

  const processRow = async (row: BulkStandImportRow) => {
    if (!row.standNumber?.trim()) throw new Error("Missing stand number");
    if (existingNumbers.has(row.standNumber.trim())) throw new Error("Stand number already exists in this development");
    const sizeSqm = parseInt(row.sizeSqm, 10);
    const price = parseFloat(row.price);
    if (!sizeSqm || sizeSqm <= 0) throw new Error("Invalid size");
    if (!price || price <= 0) throw new Error("Invalid price");

    await db.insert(stands).values({
      developmentId,
      standNumber: row.standNumber.trim(),
      sizeSqm,
      price: price.toFixed(2),
      phase: row.phase?.trim() || "Phase 1",
      notes: [row.section && `Section: ${row.section}`, row.block && `Block: ${row.block}`, row.road && `Road: ${row.road}`, row.notes]
        .filter(Boolean)
        .join(" | ") || null,
    });
    existingNumbers.add(row.standNumber.trim());
  };

  const results: (BulkStandImportRow & { ok: boolean; message: string })[] = [];

  if (atomic) {
    try {
      await db.transaction(async () => {
        for (const row of rows) {
          await processRow(row);
          results.push({ ...row, ok: true, message: "Imported" });
        }
      });
    } catch (e) {
      return { ok: false, error: `Import aborted (all-or-nothing): ${e instanceof Error ? e.message : String(e)}` };
    }
  } else {
    for (const row of rows) {
      try {
        await processRow(row);
        results.push({ ...row, ok: true, message: "Imported" });
      } catch (e) {
        results.push({ ...row, ok: false, message: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  const importedCount = results.filter((r) => r.ok).length;
  if (importedCount > 0) {
    await db
      .update(stands)
      .set({ importBatchId })
      .where(and(eq(stands.developmentId, developmentId), inArray(stands.standNumber, results.filter((r) => r.ok).map((r) => r.standNumber))));
  }

  await auditLog({
    action: "BULK_IMPORT_STANDS",
    module: "STANDS",
    newValue: { developmentId, importBatchId, imported: importedCount, failed: results.length - importedCount, atomic },
  });

  revalidatePath("/admin/stands");
  revalidatePath("/admin/developments");
  return { ok: true, results };
}

export async function updateStandAction(
  id: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const standNumber = (formData.get("standNumber") as string)?.trim();
  if (!standNumber) return { ok: false, error: "Stand number is required." };
  const sizeSqm = parseInt(formData.get("sizeSqm") as string || "0", 10);
  if (!sizeSqm || sizeSqm < 1) return { ok: false, error: "Size must be > 0." };
  const price = (formData.get("price") as string)?.trim();
  if (!price || isNaN(parseFloat(price))) return { ok: false, error: "Valid price required." };
  const phase = (formData.get("phase") as string)?.trim() || "Phase 1";
  const status = formData.get("status") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const VALID = new Set(["AVAILABLE", "PRESALE", "RESERVED", "SOLD", "BLOCKED"]);
  if (!VALID.has(status)) return { ok: false, error: "Invalid status." };

  try {
    const [prev] = await db
      .select({ standNumber: stands.standNumber, status: stands.status, price: stands.price, phase: stands.phase, sizeSqm: stands.sizeSqm })
      .from(stands)
      .where(eq(stands.id, id));
    await db.update(stands).set({ standNumber, sizeSqm, price, phase, status: status as "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED", notes, updatedAt: new Date() }).where(eq(stands.id, id));
    await auditLog({
      action: "UPDATE_STAND",
      module: "STANDS",
      previousValue: prev,
      newValue: { standId: id, standNumber, sizeSqm, price, phase, status },
    });
    revalidatePath("/admin/stands");
    revalidatePath("/sysadmin/developments");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed.";
    return { ok: false, error: msg };
  }
}

/**
 * Shared SOLD/RESERVED guard for any stand-state-changing action that
 * shouldn't run on a stand mid-transaction (delete/archive/transfer).
 */
async function assertStandNotEncumbered(standId: string) {
  const [stand] = await db.select().from(stands).where(eq(stands.id, standId));
  if (!stand) throw new Error("Stand not found.");
  if (stand.status === "SOLD" || stand.status === "RESERVED") {
    throw new Error("Cannot do this on a sold or reserved stand.");
  }
  return stand;
}

async function recordStandHistory(params: {
  standId: string;
  eventType: string;
  previousValue?: unknown;
  newValue?: unknown;
  userId: string;
}) {
  await db.insert(standHistory).values({
    standId: params.standId,
    eventType: params.eventType,
    previousValue: (params.previousValue ?? null) as object | null,
    newValue: (params.newValue ?? null) as object | null,
    userId: params.userId,
  });
}

export async function deleteStandAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    const stand = await assertStandNotEncumbered(id);
    await db.delete(stands).where(eq(stands.id, id));
    await auditLog({
      action: "DELETE_STAND",
      module: "STANDS",
      previousValue: { standId: id, status: stand.status },
      newValue: { deleted: true },
    });
    revalidatePath("/admin/stands");
    revalidatePath("/sysadmin/developments");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed.";
    return { ok: false, error: msg };
  }
}

export async function bulkUpdateStandStatusAction(
  ids: string[],
  status: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  if (!ids.length) return { ok: false, error: "No stands selected." };
  const VALID = new Set(["AVAILABLE", "PRESALE", "RESERVED", "SOLD", "BLOCKED"]);
  if (!VALID.has(status)) return { ok: false, error: "Invalid status." };
  try {
    await db
      .update(stands)
      .set({ status: status as "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED", updatedAt: new Date() })
      .where(inArray(stands.id, ids));
    await auditLog({
      action: "BULK_UPDATE_STAND_STATUS",
      module: "STANDS",
      newValue: { standIds: ids, status, count: ids.length },
    });
    revalidatePath("/admin/stands");
    revalidatePath("/sysadmin/developments");
    return { ok: true, count: ids.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}

export async function bulkDeleteStandsAction(
  ids: string[],
): Promise<{ ok: true; count: number; skipped: number } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  if (!ids.length) return { ok: false, error: "No stands selected." };
  try {
    const rows = await db
      .select({ id: stands.id, status: stands.status })
      .from(stands)
      .where(inArray(stands.id, ids));
    const eligibleIds = rows.filter((s) => s.status !== "SOLD" && s.status !== "RESERVED").map((s) => s.id);
    if (!eligibleIds.length) return { ok: false, error: "All selected stands are SOLD or RESERVED — none deleted." };
    await db.delete(stands).where(inArray(stands.id, eligibleIds));
    await auditLog({
      action: "BULK_DELETE_STANDS",
      module: "STANDS",
      newValue: { attemptedIds: ids, deletedCount: eligibleIds.length, skippedCount: ids.length - eligibleIds.length },
    });
    revalidatePath("/admin/stands");
    revalidatePath("/sysadmin/developments");
    return { ok: true, count: eligibleIds.length, skipped: ids.length - eligibleIds.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

export async function archiveStandAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  try {
    const stand = await assertStandNotEncumbered(id);
    if (stand.archivedAt) return { ok: false, error: "Stand is already archived." };
    await db.update(stands).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(stands.id, id));
    await recordStandHistory({ standId: id, eventType: "ARCHIVED", previousValue: { archivedAt: null }, newValue: { archivedAt: new Date() }, userId: user.id });
    await auditLog({ action: "ARCHIVE_STAND", module: "STANDS", previousValue: { standId: id, status: stand.status }, newValue: { archived: true } });
    revalidatePath("/admin/stands");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Archive failed." };
  }
}

export async function restoreStandAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  try {
    const [stand] = await db.select().from(stands).where(eq(stands.id, id));
    if (!stand) return { ok: false, error: "Stand not found." };
    await db.update(stands).set({ archivedAt: null, deletedAt: null, updatedAt: new Date() }).where(eq(stands.id, id));
    await recordStandHistory({ standId: id, eventType: "RESTORED", previousValue: { archivedAt: stand.archivedAt, deletedAt: stand.deletedAt }, newValue: { archivedAt: null, deletedAt: null }, userId: user.id });
    await auditLog({ action: "RESTORE_STAND", module: "STANDS", previousValue: { standId: id }, newValue: { restored: true } });
    revalidatePath("/admin/stands");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Restore failed." };
  }
}

/** Manual admin hold — creates a PENDING reservation for an existing client and locks the stand. Reuses the `reservations` table, not a parallel "hold" concept. */
export async function reserveStandAction(
  standId: string,
  clientId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  try {
    const stand = await assertStandNotEncumbered(standId);
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) return { ok: false, error: "Client not found." };

    const reference = `HOLD-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await db.transaction(async (tx) => {
      await tx.insert(reservationsTable).values({
        reference,
        clientId,
        agentId: null,
        developmentId: stand.developmentId,
        standId,
        status: "PENDING",
        message: reason || "Manual admin hold",
      });
      await tx.update(stands).set({ status: "RESERVED", updatedAt: new Date() }).where(eq(stands.id, standId));
    });

    await recordStandHistory({ standId, eventType: "RESERVED", previousValue: { status: stand.status }, newValue: { status: "RESERVED", clientId, reason }, userId: user.id });
    await auditLog({ action: "RESERVE_STAND", module: "STANDS", previousValue: { standId, status: stand.status }, newValue: { standId, clientId, reason } });
    revalidatePath("/admin/stands");
    revalidatePath("/admin/reservations");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Reserve failed." };
  }
}

/** Releases a manually-held stand back to AVAILABLE and cancels its PENDING reservation. */
export async function releaseStandAction(standId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  try {
    const [stand] = await db.select().from(stands).where(eq(stands.id, standId));
    if (!stand) return { ok: false, error: "Stand not found." };
    if (stand.status !== "RESERVED") return { ok: false, error: "Stand is not currently reserved." };

    const hasSale = await db.query.sales.findFirst({ where: eq(salesTable.standId, standId) });
    if (hasSale) return { ok: false, error: "This stand has been converted to a sale — release/cancel the sale instead." };

    await db.transaction(async (tx) => {
      await tx
        .update(reservationsTable)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(and(eq(reservationsTable.standId, standId), inArray(reservationsTable.status, ["PENDING", "PRESALE", "AWAITING_DEPOSIT"])));
      await tx.update(stands).set({ status: "AVAILABLE", updatedAt: new Date() }).where(eq(stands.id, standId));
    });

    await recordStandHistory({ standId, eventType: "RELEASED", previousValue: { status: "RESERVED" }, newValue: { status: "AVAILABLE" }, userId: user.id });
    await auditLog({ action: "RELEASE_STAND", module: "STANDS", previousValue: { standId, status: "RESERVED" }, newValue: { standId, status: "AVAILABLE" } });
    revalidatePath("/admin/stands");
    revalidatePath("/admin/reservations");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Release failed." };
  }
}

/**
 * Transfers a sold stand to a new owner. `sales.standId`, `sales.reservationId`,
 * and `installmentPlans.saleId` are all globally unique — cancelling the old sale
 * does not free those columns up for a second row, so a transfer cannot call
 * buildSaleFromReservation a second time for the same stand. Instead this
 * re-points the *existing* sale/reservation/installment-plan rows at the new
 * owner and regenerates the installment schedule in place, which also has the
 * benefit of keeping one sale number per stand rather than fragmenting history.
 */
export async function transferStandAction(
  standId: string,
  formData: FormData,
): Promise<{ ok: true; saleNumber: string } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  const newClientName = ((formData.get("clientName") as string) ?? "").trim();
  const newNationalId = ((formData.get("nationalId") as string) ?? "").trim();
  const newPhone = ((formData.get("phone") as string) ?? "").trim();
  const newEmail = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const newAddress = ((formData.get("address") as string) ?? "").trim();
  const depositAmount = parseFloat(formData.get("depositAmount") as string);
  const depositMethod = ((formData.get("depositMethod") as string) || "BANK_TRANSFER") as
    "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER";
  const depositReference = ((formData.get("depositReference") as string) ?? "").trim();
  const reason = ((formData.get("reason") as string) ?? "").trim();
  const monthsOverrideRaw = ((formData.get("months") as string) ?? "").trim();

  if (newClientName.length < 2) return { ok: false, error: "New owner's name is required." };
  if (newNationalId.length < 5) return { ok: false, error: "New owner's national ID is required." };
  if (newPhone.length < 7) return { ok: false, error: "New owner's phone is required." };
  if (!/^\S+@\S+\.\S+$/.test(newEmail)) return { ok: false, error: "Enter a valid email for the new owner." };
  if (newAddress.length < 5) return { ok: false, error: "New owner's address is required." };
  if (!depositAmount || depositAmount <= 0) return { ok: false, error: "Enter a valid deposit amount." };
  if (!depositReference) return { ok: false, error: "Enter a deposit reference." };

  try {
    const [stand] = await db.select().from(stands).where(eq(stands.id, standId));
    if (!stand) return { ok: false, error: "Stand not found." };
    if (stand.status !== "SOLD") return { ok: false, error: "Only a sold stand can be transferred." };
    const [existingSale] = await db.select().from(salesTable).where(eq(salesTable.standId, standId));
    if (!existingSale) return { ok: false, error: "This stand has no sale on record to transfer." };
    const [development] = await db.select().from(developments).where(eq(developments.id, stand.developmentId));
    if (!development) return { ok: false, error: "Development not found." };
    const [plan] = await db.select().from(installmentPlansTable).where(eq(installmentPlansTable.saleId, existingSale.id));

    const purchasePrice = parseFloat(stand.price);
    const depositClamped = Math.min(depositAmount, purchasePrice);
    const outstandingBalance = purchasePrice - depositClamped;
    const months = monthsOverrideRaw ? Math.max(parseInt(monthsOverrideRaw, 10) || 1, 1) : development.paymentDurationMonths;
    const installmentAmounts = buildInstallmentAmounts(outstandingBalance, months);
    const monthlyAmount = parseFloat(installmentAmounts[0] ?? "0");

    const previousClientId = existingSale.clientId;

    const { client } = await db.transaction(async (tx) => {
      let clientRow = await tx.query.clients.findFirst({ where: eq(clients.email, newEmail) });
      if (!clientRow) {
        const [created] = await tx
          .insert(clients)
          .values({ name: newClientName, nationalId: newNationalId, phone: newPhone, email: newEmail, address: newAddress })
          .returning();
        clientRow = created;
      } else {
        await tx
          .update(clients)
          .set({ name: newClientName, nationalId: newNationalId, phone: newPhone, address: newAddress, updatedAt: new Date() })
          .where(eq(clients.id, clientRow.id));
      }

      await tx
        .update(salesTable)
        .set({
          clientId: clientRow.id,
          purchasePrice: purchasePrice.toFixed(2),
          depositRequired: development.depositAmount,
          depositPaid: depositClamped.toFixed(2),
          outstandingBalance: outstandingBalance.toFixed(2),
          status: "ACTIVE",
          activatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(salesTable.id, existingSale.id));

      await tx
        .update(reservationsTable)
        .set({ clientId: clientRow.id, status: "APPROVED", message: `Stand transfer${reason ? `: ${reason}` : ""}`, updatedAt: new Date() })
        .where(eq(reservationsTable.id, existingSale.reservationId));

      await tx.insert(payments).values({
        clientId: clientRow.id,
        reservationId: existingSale.reservationId,
        saleId: existingSale.id,
        type: "DEPOSIT",
        method: depositMethod,
        status: "VERIFIED",
        amount: depositClamped.toFixed(2),
        currency: "USD",
        reference: depositReference,
        notes: reason || undefined,
        verifiedByUserId: user.id,
        paidAt: new Date(),
      });

      if (plan) {
        await tx
          .update(installmentPlansTable)
          .set({
            principal: outstandingBalance.toFixed(2),
            interestRate: development.interestRate,
            months,
            monthlyAmount: monthlyAmount.toFixed(2),
            startDate: new Date(),
            active: true,
          })
          .where(eq(installmentPlansTable.id, plan.id));

        await tx.delete(installmentsTable).where(eq(installmentsTable.planId, plan.id));

        const startDate = new Date();
        const installmentRows = installmentAmounts.map((amountDue, i) => {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + i + 1);
          return { planId: plan.id, sequence: i + 1, dueDate, amountDue };
        });
        await tx.insert(installmentsTable).values(installmentRows);
      }

      return { client: clientRow };
    });

    await recordStandHistory({
      standId,
      eventType: "TRANSFERRED",
      previousValue: { saleId: existingSale.id, previousClientId },
      newValue: { saleId: existingSale.id, newClientId: client.id, reason },
      userId: user.id,
    });
    await auditLog({
      action: "TRANSFER_STAND",
      module: "STANDS",
      previousValue: { standId, saleId: existingSale.id, previousClientId },
      newValue: { standId, saleNumber: existingSale.saleNumber, newClientEmail: newEmail, reason },
    });

    await sendNotification({
      recipient: newEmail,
      subject: `Stand allocated — ${development.name} Stand ${stand.standNumber}`,
      body: `Stand ${stand.standNumber} at ${development.name} has been transferred to you. Sale reference: ${existingSale.saleNumber}.`,
      html: allocationEmail({
        clientName: newClientName,
        saleNumber: existingSale.saleNumber,
        standNumber: stand.standNumber,
        developmentName: development.name,
        sizeSqm: stand.sizeSqm,
        purchasePrice,
        outstandingBalance,
        monthlyAmount: outstandingBalance > 0 ? monthlyAmount : undefined,
        paymentMonths: outstandingBalance > 0 ? months : undefined,
      }),
    }).catch(() => {});

    revalidatePath("/admin/stands");
    revalidatePath("/sysadmin/sales");
    return { ok: true, saleNumber: existingSale.saleNumber };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Transfer failed." };
  }
}

export async function bulkArchiveStandsAction(
  ids: string[],
): Promise<{ ok: true; count: number; skipped: number } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  if (!ids.length) return { ok: false, error: "No stands selected." };
  try {
    const rows = await db.select({ id: stands.id, status: stands.status, archivedAt: stands.archivedAt }).from(stands).where(inArray(stands.id, ids));
    const eligibleIds = rows.filter((s) => s.status !== "SOLD" && s.status !== "RESERVED" && !s.archivedAt).map((s) => s.id);
    if (!eligibleIds.length) return { ok: false, error: "No eligible stands to archive (all sold, reserved, or already archived)." };
    await db.update(stands).set({ archivedAt: new Date(), updatedAt: new Date() }).where(inArray(stands.id, eligibleIds));
    await Promise.all(eligibleIds.map((id) => recordStandHistory({ standId: id, eventType: "ARCHIVED", newValue: { archivedAt: new Date() }, userId: user.id })));
    await auditLog({ action: "BULK_ARCHIVE_STANDS", module: "STANDS", newValue: { attemptedIds: ids, archivedCount: eligibleIds.length, skippedCount: ids.length - eligibleIds.length } });
    revalidatePath("/admin/stands");
    return { ok: true, count: eligibleIds.length, skipped: ids.length - eligibleIds.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bulk archive failed." };
  }
}

export async function bulkEditStandsAction(
  ids: string[],
  patch: { phase?: string; price?: string; status?: "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED" },
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  if (!ids.length) return { ok: false, error: "No stands selected." };
  const set: Partial<typeof stands.$inferInsert> = { updatedAt: new Date() };
  if (patch.phase?.trim()) set.phase = patch.phase.trim();
  if (patch.price && !isNaN(parseFloat(patch.price))) set.price = parseFloat(patch.price).toFixed(2);
  if (patch.status) set.status = patch.status;
  if (Object.keys(set).length === 1) return { ok: false, error: "Nothing to update." };

  try {
    await db.update(stands).set(set).where(inArray(stands.id, ids));
    await auditLog({ action: "BULK_EDIT_STANDS", module: "STANDS", newValue: { standIds: ids, patch, count: ids.length } });
    revalidatePath("/admin/stands");
    return { ok: true, count: ids.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bulk edit failed." };
  }
}

/** Reassigns the agent on file for a batch of stands' active reservation (or sale, if already converted). */
export async function bulkAssignAgentAction(
  ids: string[],
  agentId: string | null,
): Promise<{ ok: true; results: { standId: string; ok: boolean; message: string }[] } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  if (!ids.length) return { ok: false, error: "No stands selected." };
  if (agentId) {
    const [agent] = await db.select().from(agentProfiles).where(eq(agentProfiles.id, agentId));
    if (!agent) return { ok: false, error: "Agent not found." };
  }

  const results: { standId: string; ok: boolean; message: string }[] = [];
  for (const standId of ids) {
    try {
      const [sale] = await db.select({ id: salesTable.id }).from(salesTable).where(eq(salesTable.standId, standId));
      if (sale) {
        await db.update(salesTable).set({ agentId, updatedAt: new Date() }).where(eq(salesTable.id, sale.id));
        results.push({ standId, ok: true, message: "Agent updated on sale" });
        continue;
      }
      const [reservation] = await db
        .select({ id: reservationsTable.id })
        .from(reservationsTable)
        .where(and(eq(reservationsTable.standId, standId), inArray(reservationsTable.status, ["PENDING", "PRESALE", "AWAITING_DEPOSIT", "APPROVED"])));
      if (reservation) {
        await db.update(reservationsTable).set({ agentId, updatedAt: new Date() }).where(eq(reservationsTable.id, reservation.id));
        results.push({ standId, ok: true, message: "Agent updated on reservation" });
        continue;
      }
      results.push({ standId, ok: false, message: "No active reservation or sale to assign an agent to" });
    } catch (e) {
      results.push({ standId, ok: false, message: e instanceof Error ? e.message : String(e) });
    }
  }

  await auditLog({ action: "BULK_ASSIGN_AGENT", module: "STANDS", newValue: { standIds: ids, agentId, results } });
  revalidatePath("/admin/stands");
  return { ok: true, results };
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBlogPostAction(
  formData: FormData,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  await requireRole(SYSADMIN_ROLES);
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const excerpt = (formData.get("excerpt") as string)?.trim();
  if (!excerpt) return { ok: false, error: "Excerpt is required." };
  const content = (formData.get("content") as string)?.trim();
  if (!content) return { ok: false, error: "Content is required." };
  const authorName = (formData.get("authorName") as string)?.trim() || "Amata Properties";
  const coverImage = (formData.get("coverImage") as string)?.trim() || null;
  const publish = formData.get("publish") === "1";

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let attempt = 0;
  // Ensure slug uniqueness
  while (true) {
    const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!existing.length) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  try {
    await db.insert(blogPosts).values({
      id: crypto.randomUUID(),
      slug,
      title,
      excerpt,
      content,
      authorName,
      coverImage,
      published: publish,
      publishedAt: publish ? new Date() : null,
    });
    await auditLog({
      action: "CREATE_BLOG_POST",
      module: "BLOG",
      newValue: { slug, title, published: publish },
    });
    revalidatePath("/news");
    revalidatePath("/sysadmin/blog");
    return { ok: true, slug };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create post." };
  }
}

export async function updateBlogPostAction(
  id: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(SYSADMIN_ROLES);
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const excerpt = (formData.get("excerpt") as string)?.trim();
  if (!excerpt) return { ok: false, error: "Excerpt is required." };
  const content = (formData.get("content") as string)?.trim();
  if (!content) return { ok: false, error: "Content is required." };
  const authorName = (formData.get("authorName") as string)?.trim() || "Amata Properties";
  const coverImage = (formData.get("coverImage") as string)?.trim() || null;
  const publish = formData.get("publish") === "1";

  try {
    const [current] = await db.select({ title: blogPosts.title, published: blogPosts.published, publishedAt: blogPosts.publishedAt })
      .from(blogPosts).where(eq(blogPosts.id, id));
    await db.update(blogPosts).set({
      title,
      excerpt,
      content,
      authorName,
      coverImage,
      published: publish,
      publishedAt: publish ? (current?.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    }).where(eq(blogPosts.id, id));
    await auditLog({
      action: "UPDATE_BLOG_POST",
      module: "BLOG",
      previousValue: current,
      newValue: { id, title, published: publish },
    });
    revalidatePath("/news");
    revalidatePath("/sysadmin/blog");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update post." };
  }
}

export async function toggleBlogPostPublishedAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(SYSADMIN_ROLES);
  try {
    const [post] = await db.select({ slug: blogPosts.slug, title: blogPosts.title, published: blogPosts.published }).from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) return { ok: false, error: "Post not found." };
    const nowPublished = !post.published;
    await db.update(blogPosts).set({
      published: nowPublished,
      publishedAt: nowPublished ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(blogPosts.id, id));
    await auditLog({
      action: nowPublished ? "PUBLISH_BLOG_POST" : "UNPUBLISH_BLOG_POST",
      module: "BLOG",
      previousValue: { id, published: post.published },
      newValue: { id, published: nowPublished },
    });
    revalidatePath("/news");
    revalidatePath("/sysadmin/blog");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to toggle post." };
  }
}

export async function deleteBlogPostAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(SYSADMIN_ROLES);
  try {
    const [post] = await db.select({ slug: blogPosts.slug, title: blogPosts.title }).from(blogPosts).where(eq(blogPosts.id, id));
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    await auditLog({
      action: "DELETE_BLOG_POST",
      module: "BLOG",
      previousValue: post ?? { id },
      newValue: { deleted: true },
    });
    revalidatePath("/news");
    revalidatePath("/sysadmin/blog");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete post." };
  }
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function requestPasswordResetAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required." };

  // Rate limit: 3 password reset requests per email per hour
  const rateLimitResult = await checkRateLimit(`password-reset:${email}`, { maxRequests: 3, windowSeconds: 3600 });
  if (!rateLimitResult.allowed) {
    return { ok: true }; // Silently succeed to avoid user enumeration
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Always return ok to avoid user enumeration
  if (!user) return { ok: true };

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(verifications).values({
    identifier: `password-reset:${email}`,
    value: token,
    expiresAt,
  });

  const { passwordResetEmail } = await import("@/lib/email-templates");
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.amataproperties.com"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendNotification({
    recipient: email,
    subject: "Reset your password — Amata Properties",
    body: `Reset your password using this link (expires in 1 hour): ${resetLink}`,
    html: passwordResetEmail({ name: user.name, resetLink }),
  });

  return { ok: true };
}

export async function resetPasswordAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const token = (formData.get("token") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!email || !token || !password) return { ok: false, error: "Invalid request." };

  // Rate limit: 5 password reset attempts per email per hour
  const rateLimitResult = await checkRateLimit(`reset-password:${email}`, { maxRequests: 5, windowSeconds: 3600 });
  if (!rateLimitResult.allowed) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (password !== confirm) return { ok: false, error: "Passwords do not match." };

  const verification = await db.query.verifications.findFirst({
    where: and(
      eq(verifications.identifier, `password-reset:${email}`),
      eq(verifications.value, token),
      gt(verifications.expiresAt, new Date()),
    ),
  });

  if (!verification) return { ok: false, error: "This reset link is invalid or has expired." };

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return { ok: false, error: "Account not found." };

  const { hashPassword } = await import("@/lib/password");
  const hashed = await hashPassword(password);

  // Match by accountId = email (new accounts) OR userId (old accounts where accountId was mistakenly set to userId)
  await db
    .update(accounts)
    .set({ password: hashed, accountId: email })
    .where(and(
      eq(accounts.userId, user.id),
      eq(accounts.providerId, "email"),
    ));

  // Consume token
  await db.delete(verifications).where(eq(verifications.id, verification.id));

  await auditLog({
    action: "RESET_PASSWORD",
    module: "AUTH",
    newValue: { email },
  });

  return { ok: true };
}

// ─── Send Client Statement ────────────────────────────────────────────────────

export async function sendClientStatementAction(saleId: string) {
  await requireRole(ACCOUNTS_ROLES);
  const sale = await db.query.sales.findFirst({
    where: eq(salesTable.id, saleId),
    with: {
      client: true,
      development: true,
      stand: true,
      payments: true,
    },
  });

  if (!sale) return { ok: false, error: "Sale not found." };

  const { statementEmail } = await import("@/lib/email-templates");

  const finance = getSaleFinancialSnapshot(sale);

  const statementDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const paymentHistory = sale.payments
    .filter((p: { status: string }) => p.status === "VERIFIED")
    .map((p: { paidAt: Date; amount: string; method: string; reference: string }) => ({
      date: new Date(p.paidAt).toLocaleDateString("en-GB"),
      amount: parseFloat(p.amount),
      method: p.method,
      reference: p.reference,
    }));

  await sendNotification({
    recipient: sale.client.email,
    subject: `Account Statement — ${sale.saleNumber}`,
    body: `Please find your account statement for sale ${sale.saleNumber} attached.`,
    html: statementEmail({
      clientName: sale.client.name,
      saleNumber: sale.saleNumber,
      standNumber: sale.stand.standNumber,
      developmentName: sale.development.name,
      statementDate,
      purchasePrice: parseFloat(sale.purchasePrice),
      totalPaid: finance.propertyPaid,
      outstandingBalance: finance.outstanding,
      payments: paymentHistory,
    }),
  });

  await auditLog({
    action: "SEND_STATEMENT",
    module: "ACCOUNTS",
    newValue: { saleId, recipient: sale.client.email },
  });

  return { ok: true };
}

export async function sendClientReceiptAction(paymentId: string) {
  await requireRole(ACCOUNTS_ROLES);
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: {
      client: true,
      sale: { with: { development: true, stand: true } },
    },
  });

  if (!payment?.client || !payment?.sale) {
    return { ok: false, error: "Payment or client not found." };
  }

  const { createReceiptPdf } = await import("@/lib/documents");
  const receiptNumber = payment.receiptNumber ?? `REC-${payment.reference}`;
  const pdf = await createReceiptPdf({
    reference: payment.reference,
    receiptNumber,
    date: new Date(payment.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    clientName: payment.client.name,
    nationalId: payment.client.nationalId,
    developmentName: payment.sale.development.name,
    standNumber: payment.sale.stand.standNumber,
    type: payment.type,
    method: payment.method,
    amount: `$${parseFloat(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    saleNumber: payment.sale.saleNumber,
  });

  await sendNotification({
    recipient: payment.client.email,
    subject: `Payment Receipt — ${payment.reference}`,
    body: `Please find your receipt for payment ${payment.reference} attached.`,
    attachment: { filename: `receipt-${payment.reference}.pdf`, content: pdf },
  });

  await auditLog({
    action: "EMAIL_RECEIPT",
    module: "ACCOUNTS",
    newValue: { paymentId, receiptNumber, recipient: payment.client.email },
  });

  return { ok: true };
}

export async function sendClientInvoiceAction(saleId: string) {
  await requireRole(ACCOUNTS_ROLES);
  const sale = await db.query.sales.findFirst({
    where: eq(salesTable.id, saleId),
    with: { client: true, development: true, stand: true, payments: true },
  });

  if (!sale?.client) return { ok: false, error: "Sale or client not found." };

  const { createInvoicePdf } = await import("@/lib/documents");
  const invoiceNumber = `INV-${sale.saleNumber}`;
  const finance = getSaleFinancialSnapshot(sale);
  const pdf = await createInvoicePdf({
    invoiceNumber,
    saleNumber: sale.saleNumber,
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    clientName: sale.client.name,
    nationalId: sale.client.nationalId,
    developmentName: sale.development.name,
    standNumber: sale.stand.standNumber,
    purchasePrice: finance.purchasePrice,
    depositRequired: parseFloat(sale.depositRequired),
    outstandingBalance: finance.outstanding,
    paymentTerms: sale.development.paymentTerms ?? "Per agreed schedule",
  });

  await sendNotification({
    recipient: sale.client.email,
    subject: `Invoice — ${sale.saleNumber}`,
    body: `Please find your invoice for sale ${sale.saleNumber} attached.`,
    attachment: { filename: `invoice-${sale.saleNumber}.pdf`, content: pdf },
  });

  await auditLog({
    action: "EMAIL_INVOICE",
    module: "ACCOUNTS",
    newValue: { saleId, invoiceNumber, recipient: sale.client.email },
  });

  return { ok: true };
}

// ─── Record Deposit / Installment / Admin Fee Payment ─────────────────────────
export async function recordInstallmentPayment(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sessionUser = await requireRole(PAYMENT_RECORDING_ROLES);
  const saleId     = (formData.get("saleId")    as string)?.trim();
  const clientId   = (formData.get("clientId")  as string)?.trim();
  const type       = (formData.get("type")      as string)?.trim();
  const method     = (formData.get("method")    as string)?.trim();
  const reference  = (formData.get("reference") as string)?.trim();
  const receiptNumber = (formData.get("receiptNumber") as string)?.trim();
  const receiptUrl = (formData.get("receiptUrl") as string)?.trim();
  const notes      = (formData.get("notes")     as string)?.trim() || null;
  const paidAtStr  = (formData.get("paidAt")    as string)?.trim();
  const amountRaw  = parseFloat((formData.get("amount") as string) || "0");

  if (!saleId || !clientId || !type || !method || !reference || !receiptNumber || !receiptUrl)
    return { ok: false, error: "All required fields must be filled in." };
  if (!PAYMENT_TYPES.includes(type as RecordablePaymentType))
    return { ok: false, error: "Choose Deposit, Installment, or Admin Fee." };
  if (!PAYMENT_METHODS.includes(method as PaymentMethod))
    return { ok: false, error: "Choose a valid payment method." };
  if (!amountRaw || amountRaw <= 0)
    return { ok: false, error: "Amount must be greater than zero." };

  const sale = await db.query.sales.findFirst({
    where: eq(salesTable.id, saleId),
    columns: { id: true, clientId: true, agentId: true, outstandingBalance: true },
  });
  if (!sale || sale.clientId !== clientId) {
    return { ok: false, error: "The selected sale does not match this client." };
  }
  if (type !== "ADJUSTMENT" && amountRaw > parseFloat(sale.outstandingBalance) + MONEY_EPSILON)
    return { ok: false, error: "This property payment is greater than the remaining balance." };

  const isAgentSubmission = sessionUser.role === "AGENT";
  if (isAgentSubmission) {
    const agent = await db.query.agentProfiles.findFirst({
      where: eq(agentProfiles.userId, sessionUser.id),
      columns: { id: true, active: true },
    });
    if (!agent?.active || sale.agentId !== agent.id) {
      return { ok: false, error: "You can only submit payments for sales assigned to you." };
    }
  }

  const verifiedBy = sessionUser.id;

  const paidAt = paidAtStr ? new Date(paidAtStr) : new Date();

  // Wrap payment insert and balance update in a transaction for atomicity
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      clientId,
      saleId,
      type: type as RecordablePaymentType,
      method: method as PaymentMethod,
      status: isAgentSubmission ? "PENDING" : "VERIFIED",
      amount: amountRaw.toFixed(2),
      reference,
      receiptNumber,
      receiptUrl,
      notes,
      verifiedByUserId: isAgentSubmission ? null : verifiedBy,
      paidAt,
    });

    // Deposits and installments reduce the property balance; admin fees stay separate.
    if (!isAgentSubmission && (type === "INSTALLMENT" || type === "DEPOSIT")) {
      await applyPropertyPaymentToSale(tx, saleId, amountRaw, paidAt, { isDeposit: type === "DEPOSIT" });
    }
  });

  await auditLog({
    action: "RECORD_PAYMENT",
    module: "ACCOUNTS",
    newValue: { saleId, clientId, amount: amountRaw, reference, receiptNumber, type, receiptUrl, status: isAgentSubmission ? "PENDING" : "VERIFIED", verifiedBy },
  });

  // Send notifications (non-blocking)
  if (isAgentSubmission) {
    await notifyAgentPaymentSubmission({
      saleId,
      amount: amountRaw,
      type: paymentTypeLabel(type as RecordablePaymentType),
      reference,
      receiptNumber,
      method,
      submittedBy: sessionUser.name ?? sessionUser.email ?? "Agent",
    });
  } else {
    await notifyPaymentRecorded({
      saleId,
      amount: amountRaw,
      reference,
      method,
      type: paymentTypeLabel(type as RecordablePaymentType),
      paidAt,
      recordedBy: sessionUser.name ?? sessionUser.email ?? "System",
    });
  }

  revalidatePath("/accounts");
  revalidatePath("/accounts/payments");
  revalidatePath(`/accounts/statements/${saleId}`);
  revalidatePath("/sysadmin/sales");
  revalidatePath("/agent/sales");
  revalidatePath("/client");
  revalidatePath("/client/statements");
  return { ok: true };
}

// ─── Sales Register Bulk & Inline Operations ────────────────────────────

export async function bulkUpdateSalesStatus(
  saleIds: string[],
  status: "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED",
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const sessionUser = await requireRole(SYSADMIN_ROLES);
  if (!saleIds.length) return { ok: false, error: "No sales selected." };

  await db
    .update(salesTable)
    .set({ status, updatedAt: new Date() })
    .where(inArray(salesTable.id, saleIds));

  await auditLog({
    action: "BULK_UPDATE_SALES_STATUS",
    module: "SALES",
    newValue: { saleIds, status, count: saleIds.length, userId: sessionUser.id },
  });

  revalidatePath("/sysadmin/sales");
  return { ok: true, count: saleIds.length };
}

export async function updateSaleStatusAction(
  saleId: string,
  status: "ACTIVE" | "PAID_OFF" | "DEFAULTED" | "CANCELLED",
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(SYSADMIN_ROLES);
  const [prev] = await db
    .select({ status: salesTable.status, saleNumber: salesTable.saleNumber })
    .from(salesTable)
    .where(eq(salesTable.id, saleId));

  await db
    .update(salesTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(salesTable.id, saleId));

  await auditLog({
    action: "UPDATE_SALE_STATUS",
    module: "SALES",
    previousValue: prev,
    newValue: { saleId, status },
  });

  revalidatePath("/sysadmin/sales");
  return { ok: true };
}

export async function updateSaleOutstandingAction(
  saleId: string,
  outstandingBalance: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(SYSADMIN_ROLES);
  const amount = parseFloat(outstandingBalance);
  if (isNaN(amount) || amount < 0) return { ok: false, error: "Invalid amount." };

  const [prev] = await db
    .select({ outstandingBalance: salesTable.outstandingBalance, saleNumber: salesTable.saleNumber })
    .from(salesTable)
    .where(eq(salesTable.id, saleId));

  await db
    .update(salesTable)
    .set({ outstandingBalance, updatedAt: new Date() })
    .where(eq(salesTable.id, saleId));

  await auditLog({
    action: "UPDATE_SALE_OUTSTANDING",
    module: "SALES",
    previousValue: prev,
    newValue: { saleId, outstandingBalance },
  });

  revalidatePath("/sysadmin/sales");
  return { ok: true };
}

export async function bulkInstallmentUploadAction(
  formData: FormData,
): Promise<{ saleNumber: string; amount: string; reference: string; ok: boolean; message: string }[]> {
  "use server";
  const sessionUser = await requireRole(ACCOUNTS_ROLES);
  const rowsJson = formData.get("rows") as string;
  const rows: { saleNumber: string; amount: string; method: string; reference: string; date: string; notes: string }[] =
    JSON.parse(rowsJson ?? "[]");

  const results = [];
  for (const row of rows) {
    try {
      const amountRaw = parseFloat(row.amount);
      const sale = await db.query.sales.findFirst({
        where: (s, { eq }) => eq(s.saleNumber, row.saleNumber),
        with: { installmentPlan: { with: { installments: { orderBy: (i, { asc }) => [asc(i.sequence)] } } } },
      });
      if (!sale) { results.push({ ...row, ok: false, message: "Sale not found" }); continue; }

      const paidAt = row.date ? new Date(row.date) : new Date();

      await db.transaction(async (tx) => {
        await tx.insert(payments).values({
          clientId: sale.clientId,
          saleId: sale.id,
          type: "INSTALLMENT",
          method: row.method as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
          status: "VERIFIED",
          amount: amountRaw.toFixed(2),
          reference: row.reference,
          notes: row.notes || null,
          verifiedByUserId: sessionUser.id,
          paidAt,
        });
        await applyInstallmentPaymentToSale(tx, sale.id, amountRaw, paidAt);
      });
      results.push({ ...row, ok: true, message: "Recorded" });
    } catch (e) {
      results.push({ ...row, ok: false, message: String(e) });
    }
  }

  revalidatePath("/accounts");
  revalidatePath("/sysadmin/sales");
  return results;
}

export async function submitPaymentProofAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { ok: false, message: "Not logged in." };

  const client = await db.query.clients.findFirst({
    where: (c, { eq }) => eq(c.userId, sessionUser.id),
    with: { sales: { columns: { id: true, saleNumber: true, clientId: true, outstandingBalance: true } } },
  });
  const sale = client?.sales?.[0];
  if (!sale) return { ok: false, message: "No active sale found for your account." };

  const amountRaw = parseFloat((formData.get("amount") as string) || "0");
  if (!amountRaw || amountRaw <= 0) return { ok: false, message: "Invalid amount." };

  const method = (formData.get("method") as string)?.trim();
  const reference = (formData.get("reference") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;
  const paidAtStr = (formData.get("paidAt") as string)?.trim();
  if (!method || !reference) return { ok: false, message: "Method and reference are required." };

  const paidAt = paidAtStr ? new Date(paidAtStr) : new Date();

  // Optionally upload proof file
  let proofUrl: string | undefined;
  const proofFile = formData.get("proof") as File | null;
  if (proofFile && proofFile.size > 0 && isStorageConfigured()) {
    if (proofFile.size > 5 * 1024 * 1024) return { ok: false, message: "File must be under 5 MB." };
    const ext = proofFile.name.split(".").pop() ?? "bin";
    const key = saleDocKey(sale.id, "proof", `${Date.now()}.${ext}`);
    const buf = Buffer.from(await proofFile.arrayBuffer());
    const { url } = await uploadFile(key, buf, proofFile.type || "application/octet-stream");
    proofUrl = url;
  }

  // Insert a PENDING payment — accounts staff verify it
  await db.insert(payments).values({
    clientId: sale.clientId,
    saleId: sale.id,
    type: "INSTALLMENT",
    method: method as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
    status: "PENDING",
    amount: amountRaw.toFixed(2),
    reference,
    notes: [notes, proofUrl ? `Proof: ${proofUrl}` : null].filter(Boolean).join(" | ") || null,
    paidAt,
  });

  // Notify accounts staff
  const admins = await db.select({ name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.role, ["ADMINISTRATOR", "SYSTEM_ADMIN", "ACCOUNTS"]));

  await Promise.allSettled(
    admins.filter((a) => a.email?.includes("@")).map((a) =>
      sendNotification({
        recipient: a.email!,
        subject: `Payment Proof Submitted — ${sale.saleNumber}`,
        body: `${client!.name} submitted payment proof for ${sale.saleNumber}. Amount: $${amountRaw.toFixed(2)}, ref: ${reference}. Awaiting verification.`,
      })
    )
  );

  revalidatePath("/client");
  revalidatePath("/accounts");
  return { ok: true, message: "Your payment has been submitted and is awaiting verification by our accounts team." };
}

// ─── Group Buying ───────────────────────────────────────────────────────────────

const GROUP_ADMIN_ROLES: UserRole[] = ["GROUP_ADMIN", "ADMINISTRATOR", "SYSTEM_ADMIN"];

export async function createGroupAction(
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const orgType = (formData.get("orgType") as string)?.trim();
  const registrationNumber = (formData.get("registrationNumber") as string)?.trim() || null;
  const contactPersonName = (formData.get("contactPersonName") as string)?.trim();
  const contactPersonEmail = (formData.get("contactPersonEmail") as string)?.trim().toLowerCase();
  const contactPersonPhone = (formData.get("contactPersonPhone") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const developmentId = (formData.get("developmentId") as string)?.trim();
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const agreementDocUrl = (formData.get("agreementDocUrl") as string)?.trim() || null;
  const defaultPaymentPlanMonthsRaw = formData.get("defaultPaymentPlanMonths") as string | null;
  const defaultDepositAmountRaw = formData.get("defaultDepositAmount") as string | null;
  const publish = formData.get("publish") === "true";

  if (!name || name.length < 2) return { ok: false, error: "Group name is required." };
  if (!orgType) return { ok: false, error: "Organisation type is required." };
  if (!contactPersonName || contactPersonName.length < 2) return { ok: false, error: "Contact person name is required." };
  if (!/^\S+@\S+\.\S+$/.test(contactPersonEmail ?? "")) return { ok: false, error: "Enter a valid contact email." };
  if (!contactPersonPhone || contactPersonPhone.length < 7) return { ok: false, error: "Contact phone is required." };
  if (!developmentId) return { ok: false, error: "Choose a development." };

  try {
    const [group] = await db
      .insert(groups)
      .values({
        name,
        description,
        orgType,
        registrationNumber,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
        address,
        logoUrl,
        agreementDocUrl,
        developmentId,
        defaultPaymentPlanMonths: defaultPaymentPlanMonthsRaw ? parseInt(defaultPaymentPlanMonthsRaw, 10) || null : null,
        defaultDepositAmount: defaultDepositAmountRaw && !isNaN(parseFloat(defaultDepositAmountRaw)) ? defaultDepositAmountRaw : null,
        status: publish ? "ACTIVE" : "DRAFT",
      })
      .returning();

    await auditLog({
      action: "CREATE_GROUP",
      module: "GROUP_BUYING",
      newValue: { id: group.id, name, developmentId, status: group.status },
    });

    revalidatePath("/admin/groups");
    return { ok: true, id: group.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create group." };
  }
}

export async function archiveGroupAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    await db.update(groups).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(groups.id, id));
    await auditLog({ action: "ARCHIVE_GROUP", module: "GROUP_BUYING", newValue: { id } });
    revalidatePath("/admin/groups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to archive group." };
  }
}

export async function publishGroupAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    await db.update(groups).set({ status: "ACTIVE", updatedAt: new Date() }).where(eq(groups.id, id));
    await auditLog({ action: "PUBLISH_GROUP", module: "GROUP_BUYING", newValue: { id } });
    revalidatePath("/admin/groups");
    revalidatePath("/group-admin");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to publish group." };
  }
}

export type GroupMemberImportRow = {
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  address?: string;
};

/**
 * Bulk group-member import from the group onboarding wizard's Step 3 — same
 * preview-then-commit shape as bulkImportStandsAction: per-row try/catch,
 * returns {...row, ok, message}[]. Each row is a find-or-create on `clients`
 * by email (the same find-or-create pattern already used by
 * createDirectSaleAction/createAgentPresaleAction/sale-conversion.ts),
 * tagged with the group's id.
 */
export async function bulkImportGroupMembersAction(
  groupId: string,
  formData: FormData,
): Promise<{ ok: true; results: (GroupMemberImportRow & { ok: boolean; message: string })[] } | { ok: false; error: string }> {
  await requireRole(GROUP_ADMIN_ROLES);
  const rowsJson = formData.get("rows") as string;
  const atomic = formData.get("atomic") === "on";

  let rows: GroupMemberImportRow[];
  try {
    rows = JSON.parse(rowsJson ?? "[]");
  } catch {
    return { ok: false, error: "Invalid import data." };
  }
  if (rows.length === 0) return { ok: false, error: "No rows to import." };

  const processRow = async (row: GroupMemberImportRow) => {
    if (!row.name?.trim()) throw new Error("Missing name");
    if (!row.nationalId?.trim()) throw new Error("Missing national ID");
    if (!row.phone?.trim()) throw new Error("Missing phone");
    const email = row.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Missing or invalid email");

    const existing = await db.query.clients.findFirst({ where: eq(clients.email, email) });
    if (existing) {
      await db
        .update(clients)
        .set({ name: row.name.trim(), nationalId: row.nationalId.trim(), phone: row.phone.trim(), address: row.address?.trim() || existing.address, groupId, updatedAt: new Date() })
        .where(eq(clients.id, existing.id));
    } else {
      await db.insert(clients).values({
        name: row.name.trim(),
        nationalId: row.nationalId.trim(),
        phone: row.phone.trim(),
        email,
        address: row.address?.trim() || "Not provided",
        groupId,
      });
    }
  };

  const results: (GroupMemberImportRow & { ok: boolean; message: string })[] = [];

  if (atomic) {
    try {
      await db.transaction(async () => {
        for (const row of rows) {
          await processRow(row);
          results.push({ ...row, ok: true, message: "Imported" });
        }
      });
    } catch (e) {
      return { ok: false, error: `Import aborted (all-or-nothing): ${e instanceof Error ? e.message : String(e)}` };
    }
  } else {
    for (const row of rows) {
      try {
        await processRow(row);
        results.push({ ...row, ok: true, message: "Imported" });
      } catch (e) {
        results.push({ ...row, ok: false, message: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  const importedCount = results.filter((r) => r.ok).length;
  await auditLog({
    action: "BULK_IMPORT_GROUP_MEMBERS",
    module: "GROUP_BUYING",
    newValue: { groupId, imported: importedCount, failed: results.length - importedCount, atomic },
  });

  revalidatePath("/admin/groups");
  revalidatePath("/group-admin/members");
  return { ok: true, results };
}

/**
 * Invites a group administrator — reuses the exact verifications +
 * password-reset-token convention already used by inviteUserAction (7-day
 * expiry, `password-reset:{email}` identifier, same inviteWithLinkEmail
 * template).
 */
export async function inviteGroupAdminAction(
  groupId: string,
  name: string,
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedName.length < 2) return { ok: false, error: "Name is required." };
  if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return { ok: false, error: "Enter a valid email address." };

  try {
    let user = await db.query.users.findFirst({ where: eq(users.email, trimmedEmail) });

    if (user && user.role !== "GROUP_ADMIN") {
      return { ok: false, error: "This email belongs to an existing user with a different role." };
    }

    if (!user) {
      const [created] = await db
        .insert(users)
        .values({ name: trimmedName, email: trimmedEmail, emailVerified: false, role: "GROUP_ADMIN" })
        .returning();
      user = created;

      await db.insert(accounts).values({ userId: user.id, accountId: trimmedEmail, providerId: "email", password: null });

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(verifications).values({ identifier: `password-reset:${trimmedEmail}`, value: token, expiresAt });

      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.amataproperties.com"}/reset-password?token=${token}&email=${encodeURIComponent(trimmedEmail)}`;

      sendNotification({
        recipient: trimmedEmail,
        subject: "You've been invited to manage an Amata Properties group",
        body: `Hi ${trimmedName}, you've been invited as a group administrator. Set up your account here: ${inviteLink} (expires in 7 days)`,
        html: inviteWithLinkEmail({ name: trimmedName, email: trimmedEmail, role: "GROUP_ADMIN", inviteLink }),
      }).catch(() => {});
    }

    await db.update(groups).set({ groupAdminUserId: user.id, updatedAt: new Date() }).where(eq(groups.id, groupId));

    await auditLog({
      action: "INVITE_GROUP_ADMIN",
      module: "GROUP_BUYING",
      newValue: { groupId, userId: user.id, email: trimmedEmail },
    });

    revalidatePath("/admin/groups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to invite group administrator." };
  }
}

export async function transferGroupAdminOwnershipAction(
  groupId: string,
  newUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    const [newAdmin] = await db.select().from(users).where(eq(users.id, newUserId));
    if (!newAdmin || newAdmin.role !== "GROUP_ADMIN") {
      return { ok: false, error: "Target user must already have the Group Administrator role." };
    }
    const [prev] = await db.select({ groupAdminUserId: groups.groupAdminUserId }).from(groups).where(eq(groups.id, groupId));
    await db.update(groups).set({ groupAdminUserId: newUserId, updatedAt: new Date() }).where(eq(groups.id, groupId));
    await auditLog({
      action: "TRANSFER_GROUP_ADMIN",
      module: "GROUP_BUYING",
      previousValue: { groupId, previousAdminUserId: prev?.groupAdminUserId ?? null },
      newValue: { groupId, newAdminUserId: newUserId },
    });
    revalidatePath("/admin/groups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to transfer group admin." };
  }
}

export async function deactivateGroupAdminAction(groupId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(ADMIN_ROLES);
  try {
    const [prev] = await db.select({ groupAdminUserId: groups.groupAdminUserId }).from(groups).where(eq(groups.id, groupId));
    await db.update(groups).set({ groupAdminUserId: null, updatedAt: new Date() }).where(eq(groups.id, groupId));
    await auditLog({
      action: "DEACTIVATE_GROUP_ADMIN",
      module: "GROUP_BUYING",
      previousValue: { groupId, previousAdminUserId: prev?.groupAdminUserId ?? null },
      newValue: { groupId, groupAdminUserId: null },
    });
    revalidatePath("/admin/groups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to deactivate group admin." };
  }
}

export type GroupAllocationRow = { clientId: string; standId: string };

/**
 * Bulk "assign stands to members" step of the group wizard — calls the
 * allocateGroupMemberToStand wrapper once per row in a loop with per-row
 * try/catch (not one transaction — one failed allocation must not roll back
 * the others).
 */
export async function bulkAllocateGroupStandsAction(
  groupId: string,
  rows: GroupAllocationRow[],
  depositAmount: number,
  depositMethod: "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
): Promise<{ ok: true; results: Awaited<ReturnType<typeof allocateGroupMemberToStand>>[] } | { ok: false; error: string }> {
  const user = await requireRole(ADMIN_ROLES);
  if (!rows.length) return { ok: false, error: "No allocations to process." };

  const results = [];
  for (const row of rows) {
    const result = await allocateGroupMemberToStand({
      groupId,
      clientId: row.clientId,
      standId: row.standId,
      depositAmount,
      depositMethod,
      depositReference: `GROUP-${groupId.slice(0, 8)}`,
      verifiedByUserId: user.id,
    });
    results.push(result);
  }

  const successCount = results.filter((r) => r.ok).length;
  await auditLog({
    action: "BULK_ALLOCATE_GROUP_STANDS",
    module: "GROUP_BUYING",
    newValue: { groupId, attempted: rows.length, succeeded: successCount },
  });

  revalidatePath("/admin/groups");
  revalidatePath("/group-admin");
  return { ok: true, results };
}

/** Thin read wrapper so the client-driven group wizard can fetch a development's available stands mid-flow. */
export async function listAvailableStandsForWizardAction(developmentId: string) {
  await requireRole(ADMIN_ROLES);
  return db.query.stands.findMany({
    where: and(
      eq(stands.developmentId, developmentId),
      eq(stands.status, "AVAILABLE"),
      isNull(stands.archivedAt),
      isNull(stands.deletedAt),
    ),
    orderBy: (s, { asc }) => [asc(s.standNumber)],
  });
}

/** Thin read wrapper so the group wizard can show which members were imported before pairing them with stands. */
export async function listGroupMembersForWizardAction(groupId: string) {
  await requireRole(ADMIN_ROLES);
  return db.query.clients.findMany({
    where: eq(clients.groupId, groupId),
    orderBy: (c, { asc }) => [asc(c.name)],
  });
}
