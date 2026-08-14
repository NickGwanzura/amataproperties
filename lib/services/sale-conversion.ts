import { db } from "@/lib/db/index";
import {
  accounts,
  payments,
  stands,
  reservations as reservationsTable,
  sales as salesTable,
  installmentPlans as installmentPlansTable,
  installments as installmentsTable,
  documents,
  users as usersTable,
  verifications,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createCommission } from "@/lib/db/queries/commissions";
import { sendNotification } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";
import { buildInstallmentAmounts } from "@/lib/finance";
import { depositPaidEmail, allocationEmail, adminSaleAlertEmail } from "@/lib/email-templates";


export type SaleInput = {
  reservationId: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  agentId: string | null;
  agentEmail: string | null;
  commissionRate: string;
  developmentId: string;
  developmentName: string;
  developmentDeposit: number;
  developmentInterest: string;
  standId: string;
  standNumber: string;
  standSizeSqm: number;
  reference: string;
  purchasePrice: number;
  depositAmount: number;
  depositMethod: string;
  depositReference: string;
  depositNotes: string | undefined;
  months: number;
  verifiedByUserId: string;
};

export type SaleResult = {
  saleId: string;
  saleNumber: string;
  planId: string;
};

export async function buildSaleFromReservation(input: SaleInput): Promise<SaleResult> {
  const depositClamped = Math.min(input.depositAmount, input.purchasePrice);
  const outstandingBalance = input.purchasePrice - depositClamped;
  const months = Math.max(input.months, 1);
  const installmentAmounts = buildInstallmentAmounts(outstandingBalance, months);
  const monthlyAmount = parseFloat(installmentAmounts[0] ?? "0");
  const saleNumber = `SALE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { saleId, planId, passwordSetToken } = await db.transaction(async (tx) => {
    const [createdSale] = await tx
      .insert(salesTable)
      .values({
        saleNumber,
        reservationId: input.reservationId,
        clientId: input.clientId,
        agentId: input.agentId ?? undefined,
        developmentId: input.developmentId,
        standId: input.standId,
        purchasePrice: String(input.purchasePrice),
        depositRequired: String(input.developmentDeposit),
        depositPaid: String(depositClamped),
        outstandingBalance: String(outstandingBalance),
      })
      .returning();

    await tx.insert(payments).values({
      clientId: input.clientId,
      reservationId: input.reservationId,
      saleId: createdSale.id,
      type: "DEPOSIT",
      method: input.depositMethod as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
      status: "VERIFIED",
      amount: String(depositClamped),
      currency: "USD",
      reference: input.depositReference,
      notes: input.depositNotes,
      verifiedByUserId: input.verifiedByUserId,
      paidAt: new Date(),
    });

    const startDate = new Date();
    const [{ id: planId }] = await tx
      .insert(installmentPlansTable)
      .values({
        saleId: createdSale.id,
        principal: String(outstandingBalance),
        interestRate: input.developmentInterest,
        months,
        monthlyAmount: String(monthlyAmount),
        startDate,
      })
      .returning({ id: installmentPlansTable.id });

    const installmentRows = installmentAmounts.map((amountDue, i) => {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      return { planId, sequence: i + 1, dueDate, amountDue };
    });
    await tx.insert(installmentsTable).values(installmentRows);

    await tx
      .update(reservationsTable)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(reservationsTable.id, input.reservationId));

    await tx
      .update(stands)
      .set({ status: "SOLD", updatedAt: new Date() })
      .where(eq(stands.id, input.standId));

    await tx.insert(documents).values([
      {
        type: "SALE_AGREEMENT",
        title: `Sale Agreement — ${saleNumber}`,
        url: `/documents/${saleNumber}-agreement.pdf`,
        developmentId: input.developmentId,
        saleId: createdSale.id,
      },
      {
        type: "RECEIPT",
        title: `Deposit Receipt — USD ${depositClamped.toLocaleString()}`,
        url: `/documents/${saleNumber}-receipt.pdf`,
        developmentId: input.developmentId,
        saleId: createdSale.id,
      },
      {
        type: "STATEMENT",
        title: `Account Statement — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
        url: `/documents/${saleNumber}-statement.pdf`,
        developmentId: input.developmentId,
        saleId: createdSale.id,
      },
    ]);

    // Create (or reuse) a user account so the client can log in.
    const { clients } = await import("@/lib/db/schema");
    const [existingUser] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, input.clientEmail))
      .limit(1);

    let clientUserId: string;

    if (existingUser) {
      clientUserId = existingUser.id;
      // Ensure role is CLIENT and accountId uses email (fixes old bad records)
      await tx
        .update(usersTable)
        .set({ role: "CLIENT", updatedAt: new Date() })
        .where(eq(usersTable.id, clientUserId));
      await tx
        .update(accounts)
        .set({ accountId: input.clientEmail })
        .where(eq(accounts.userId, clientUserId));
    } else {
      const [newUser] = await tx
        .insert(usersTable)
        .values({
          name: input.clientName,
          email: input.clientEmail,
          emailVerified: true,
          role: "CLIENT",
        })
        .returning();
      clientUserId = newUser.id;
      // accountId MUST be the email — resetPasswordAction matches on accountId = email
      await tx.insert(accounts).values({
        userId: clientUserId,
        providerId: "email",
        accountId: input.clientEmail,
        password: null, // set via the set-password link below
      });
    }

    // Link the client business record to the user account
    await tx
      .update(clients)
      .set({ userId: clientUserId, updatedAt: new Date() })
      .where(eq(clients.id, input.clientId));

    // Create a 30-day set-password token so the allocation email can include a direct link
    const passwordSetToken = crypto.randomUUID();
    await tx.insert(verifications).values({
      identifier: `password-reset:${input.clientEmail}`,
      value: passwordSetToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { saleId: createdSale.id, planId, passwordSetToken };
  });

  if (input.agentId) {
    await createCommission(saleId, input.agentId, input.commissionRate);
  }

  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const admins = await db
    .select({ name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(inArray(usersTable.role, ["ADMINISTRATOR", "SYSTEM_ADMIN", "ACCOUNTS"]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.amataproperties.com";
  const setPasswordLink = `${appUrl}/reset-password?token=${passwordSetToken}&email=${encodeURIComponent(input.clientEmail)}`;

  await Promise.allSettled([
    sendNotification({
      recipient: input.clientEmail,
      subject: `Deposit received — ${saleNumber}`,
      body: `Your deposit (${input.depositReference}) has been verified. Stand ${input.standNumber} at ${input.developmentName} is now allocated to you.`,
      html: depositPaidEmail({
        clientName: input.clientName,
        saleNumber,
        standNumber: input.standNumber,
        developmentName: input.developmentName,
        depositAmount: depositClamped,
        depositReference: input.depositReference,
        depositMethod: input.depositMethod,
      }),
    }),
    sendNotification({
      recipient: input.clientEmail,
      subject: `Stand allocated — ${input.developmentName} Stand ${input.standNumber}`,
      body: `Congratulations! Stand ${input.standNumber} at ${input.developmentName} has been allocated to you. Sale reference: ${saleNumber}. Set your portal password here: ${setPasswordLink}`,
      html: allocationEmail({
        clientName: input.clientName,
        saleNumber,
        standNumber: input.standNumber,
        developmentName: input.developmentName,
        sizeSqm: input.standSizeSqm,
        purchasePrice: input.purchasePrice,
        outstandingBalance,
        monthlyAmount: outstandingBalance > 0 ? monthlyAmount : undefined,
        paymentMonths: outstandingBalance > 0 ? months : undefined,
        setPasswordLink,
      }),
    }),
    input.agentEmail
      ? sendNotification({
          recipient: input.agentEmail,
          subject: `Sale completed — ${saleNumber}`,
          body: `Sale ${saleNumber} for ${input.clientName} at ${input.developmentName} has been activated. Commission is pending approval.`,
        })
      : Promise.resolve(),
    ...admins
      .filter((a) => a.email?.includes("@"))
      .map((a) =>
        sendNotification({
          recipient: a.email,
          subject: `Sale Completed — ${saleNumber} (${input.developmentName} Stand ${input.standNumber})`,
          body: `Sale ${saleNumber} for ${input.clientName}. Stand ${input.standNumber}, ${input.developmentName}. Deposit: ${fmt.format(depositClamped)}.`,
          html: adminSaleAlertEmail({
            adminName: a.name,
            clientName: input.clientName,
            agentName: input.agentEmail ?? "—",
            saleNumber,
            standNumber: input.standNumber,
            developmentName: input.developmentName,
            purchasePrice: fmt.format(input.purchasePrice),
            depositPaid: fmt.format(depositClamped),
            depositReference: input.depositReference,
            outstanding: fmt.format(outstandingBalance),
            monthlyAmount: fmt.format(monthlyAmount),
            months,
          }),
        }),
      ),
  ]);

  await auditLog({
    userId: input.verifiedByUserId,
    action: "CONVERT_TO_SALE",
    module: "ACCOUNTS",
    newValue: {
      reservationReference: input.reference,
      saleNumber,
      amount: depositClamped,
      method: input.depositMethod,
    },
  });

  return { saleId, saleNumber, planId };
}
