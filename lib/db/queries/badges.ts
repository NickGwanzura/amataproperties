import { count, eq, inArray, and, lte } from "drizzle-orm";
import { db, canUseDatabase } from "@/lib/db";
import {
  reservations,
  payments,
  leads,
  clients,
  commissions,
  stands,
  installments,
  installmentPlans,
  sales,
  users,
} from "@/lib/db/schema";

/** Badge counts for the Accounts dashboard sidebar */
export async function getAccountsBadges(): Promise<Record<string, number>> {
  if (!canUseDatabase()) return {};

  const [awaitingDeposit] = await db
    .select({ count: count() })
    .from(reservations)
    .where(inArray(reservations.status, ["AWAITING_DEPOSIT", "PRESALE"]));

  const [pendingPayments] = await db
    .select({ count: count() })
    .from(payments)
    .where(eq(payments.status, "PENDING"));

  return {
    "/accounts": Number(awaitingDeposit.count),
    "/accounts/payments": Number(pendingPayments.count),
  };
}

/** Badge counts for the Agent CRM dashboard sidebar */
export async function getAgentBadges(agentId?: string): Promise<Record<string, number>> {
  if (!canUseDatabase()) return {};

  const newLeadsQuery = agentId
    ? and(eq(leads.status, "NEW"), eq(leads.agentId, agentId))
    : eq(leads.status, "NEW");

  const [newLeads] = await db
    .select({ count: count() })
    .from(leads)
    .where(newLeadsQuery);

  const [kycInReview] = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.kycStatus, "IN_REVIEW"));

  const pendingCommissionsQuery = agentId
    ? and(eq(commissions.status, "PENDING"), eq(commissions.agentId, agentId))
    : eq(commissions.status, "PENDING");

  const [pendingCommissions] = await db
    .select({ count: count() })
    .from(commissions)
    .where(pendingCommissionsQuery);

  return {
    "/agent": Number(newLeads.count),
    "/agent/kyc": Number(kycInReview.count),
    "/agent/commissions": Number(pendingCommissions.count),
  };
}

/** Badge counts for the Admin ERP dashboard sidebar */
export async function getAdminBadges(): Promise<Record<string, number>> {
  if (!canUseDatabase()) return {};

  const [availableStands] = await db
    .select({ count: count() })
    .from(stands)
    .where(eq(stands.status, "AVAILABLE"));

  return {
    "/admin/stands": Number(availableStands.count),
  };
}

/** Badge counts for the CEO dashboard sidebar */
export async function getCeoBadges(): Promise<Record<string, number>> {
  if (!canUseDatabase()) return {};

  // Active sales with overdue installments
  const now = new Date();
  const overdueResult = await db
    .select({ count: count() })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .where(
      and(
        lte(installments.dueDate, now),
        eq(installments.amountPaid, "0"),
        eq(sales.status, "ACTIVE"),
      ),
    );

  return {
    "/ceo/aging": Number(overdueResult[0].count),
  };
}

/** Badge counts for the Client Portal dashboard sidebar */
export async function getClientBadges(userId?: string): Promise<Record<string, number>> {
  if (!canUseDatabase()) return {};

  const now = new Date();

  // If we know the user, only count overdue installments on their sales
  if (userId) {
    const [overduePayments] = await db
      .select({ count: count() })
      .from(installments)
      .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
      .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
      .innerJoin(clients, eq(sales.clientId, clients.id))
      .where(
        and(
          lte(installments.dueDate, now),
          eq(installments.amountPaid, "0"),
          eq(clients.userId, userId),
        ),
      );

    return {
      "/client/payments": Number(overduePayments.count),
    };
  }

  // Fallback: global count (legacy)
  const [overduePayments] = await db
    .select({ count: count() })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .where(
      and(
        lte(installments.dueDate, now),
        eq(installments.amountPaid, "0"),
      ),
    );

  return {
    "/client/payments": Number(overduePayments.count),
  };
}

/** Badge counts for the System Admin dashboard sidebar */
export async function getSysadminBadges(): Promise<Record<string, number>> {
  if (!canUseDatabase()) return {};

  const [pendingUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "PUBLIC"));

  const [pendingPayments] = await db
    .select({ count: count() })
    .from(payments)
    .where(eq(payments.status, "PENDING"));

  return {
    "/sysadmin/users": Number(pendingUsers.count),
    "/sysadmin": Number(pendingPayments.count),
  };
}
