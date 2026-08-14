import { count, eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, sales, developments, installments, installmentPlans, clients, stands } from "@/lib/db/schema";

/** Verified installment payments grouped by month + development */
export async function getCollectedInstallmentRevenue() {
  const rows = await db
    .select({
      monthKey: sql<string>`to_char(${payments.paidAt}, 'Mon YYYY')`,
      developmentId: sales.developmentId,
      developmentName: developments.name,
      collected: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      paymentCount: count(payments.id),
    })
    .from(payments)
    .innerJoin(sales, eq(payments.saleId, sales.id))
    .innerJoin(developments, eq(sales.developmentId, developments.id))
    .where(and(eq(payments.status, "VERIFIED"), eq(payments.type, "INSTALLMENT")))
    .groupBy(
      sql`to_char(${payments.paidAt}, 'Mon YYYY')`,
      sales.developmentId,
      developments.name,
    )
    .orderBy(sql`min(${payments.paidAt})`, developments.name);

  return rows.map((r) => ({
    monthKey: r.monthKey,
    developmentId: r.developmentId,
    developmentName: r.developmentName,
    collected: parseFloat(r.collected),
    paymentCount: Number(r.paymentCount),
  }));
}

/** Expected installment amounts (what's due) grouped by month + development */
export async function getExpectedInstallmentRevenue() {
  const rows = await db
    .select({
      monthKey: sql<string>`to_char(${installments.dueDate}, 'Mon YYYY')`,
      developmentId: sales.developmentId,
      developmentName: developments.name,
      expected: sql<string>`coalesce(sum(${installments.amountDue}), 0)`,
      paid: sql<string>`coalesce(sum(${installments.amountPaid}), 0)`,
      installmentCount: count(installments.id),
    })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .innerJoin(developments, eq(sales.developmentId, developments.id))
    .groupBy(
      sql`to_char(${installments.dueDate}, 'Mon YYYY')`,
      sales.developmentId,
      developments.name,
    )
    .orderBy(sql`min(${installments.dueDate})`, developments.name);

  return rows.map((r) => ({
    monthKey: r.monthKey,
    developmentId: r.developmentId,
    developmentName: r.developmentName,
    expected: parseFloat(r.expected),
    paid: parseFloat(r.paid),
    installmentCount: Number(r.installmentCount),
  }));
}

/** Summary stats for KPIs */
export async function getInstallmentRevenueSummary() {
  // Total collected from verified installment payments
  const [collected] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.status, "VERIFIED"), eq(payments.type, "INSTALLMENT")));

  // Total expected from all active installments
  const [expected] = await db
    .select({ total: sql<string>`coalesce(sum(${installments.amountDue}), 0)` })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .where(eq(sales.status, "ACTIVE"));

  // Overdue installments (due date passed, not paid)
  const [overdue] = await db
    .select({ count: count() })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .where(
      and(
        sql`${installments.dueDate} < now()`,
        sql`${installments.amountPaid}::numeric < ${installments.amountDue}::numeric`,
        eq(sales.status, "ACTIVE"),
      ),
    );

  // Active installment plans count
  const [activePlans] = await db
    .select({ count: count() })
    .from(installmentPlans)
    .where(eq(installmentPlans.active, true));

  const totalCollected = parseFloat(collected?.total ?? "0");
  const totalExpected = parseFloat(expected?.total ?? "0");

  return {
    totalCollected,
    totalExpected,
    collectionRate: totalExpected > 0 ? totalCollected / totalExpected : 0,
    overdueInstallments: Number(overdue?.count ?? 0),
    activePlans: Number(activePlans?.count ?? 0),
  };
}

/** Overdue installments grouped by development with aging buckets */
export async function getInstallmentAgingByDevelopment() {
  const rows = await db
    .select({
      developmentId: developments.id,
      developmentName: developments.name,
      bucket0_30: sql<string>`coalesce(sum(case when extract(day from now() - ${installments.dueDate}) between 0 and 30 then (${installments.amountDue}::numeric - ${installments.amountPaid}::numeric) else 0 end), 0)`,
      bucket31_60: sql<string>`coalesce(sum(case when extract(day from now() - ${installments.dueDate}) between 31 and 60 then (${installments.amountDue}::numeric - ${installments.amountPaid}::numeric) else 0 end), 0)`,
      bucket61_90: sql<string>`coalesce(sum(case when extract(day from now() - ${installments.dueDate}) between 61 and 90 then (${installments.amountDue}::numeric - ${installments.amountPaid}::numeric) else 0 end), 0)`,
      bucket90plus: sql<string>`coalesce(sum(case when extract(day from now() - ${installments.dueDate}) > 90 then (${installments.amountDue}::numeric - ${installments.amountPaid}::numeric) else 0 end), 0)`,
      overdueCount: count(installments.id),
    })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .innerJoin(developments, eq(sales.developmentId, developments.id))
    .where(
      and(
        sql`${installments.dueDate} < now()`,
        sql`${installments.amountPaid}::numeric < ${installments.amountDue}::numeric`,
        eq(sales.status, "ACTIVE"),
      ),
    )
    .groupBy(developments.id, developments.name)
    .orderBy(developments.name);

  return rows.map((r) => ({
    developmentId: r.developmentId,
    developmentName: r.developmentName,
    bucket0_30: parseFloat(r.bucket0_30),
    bucket31_60: parseFloat(r.bucket31_60),
    bucket61_90: parseFloat(r.bucket61_90),
    bucket90plus: parseFloat(r.bucket90plus),
    totalOverdue: parseFloat(r.bucket0_30) + parseFloat(r.bucket31_60) + parseFloat(r.bucket61_90) + parseFloat(r.bucket90plus),
    overdueCount: Number(r.overdueCount),
  }));
}

/** Detailed list of overdue installments with client and stand info */
export async function getOverdueInstallmentsDetail() {
  const rows = await db
    .select({
      installmentId: installments.id,
      dueDate: installments.dueDate,
      amountDue: sql<string>`(${installments.amountDue}::numeric - ${installments.amountPaid}::numeric)`,
      daysOverdue: sql<number>`extract(day from now() - ${installments.dueDate})`,
      clientName: clients.name,
      clientPhone: clients.phone,
      saleNumber: sales.saleNumber,
      standNumber: stands.standNumber,
      developmentName: developments.name,
      developmentId: developments.id,
    })
    .from(installments)
    .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
    .innerJoin(sales, eq(installmentPlans.saleId, sales.id))
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .innerJoin(developments, eq(sales.developmentId, developments.id))
    .innerJoin(stands, eq(sales.standId, stands.id))
    .where(
      and(
        sql`${installments.dueDate} < now()`,
        sql`${installments.amountPaid}::numeric < ${installments.amountDue}::numeric`,
        eq(sales.status, "ACTIVE"),
      ),
    )
    .orderBy(developments.name, installments.dueDate);

  return rows.map((r) => ({
    installmentId: r.installmentId,
    dueDate: r.dueDate,
    amountDue: parseFloat(r.amountDue),
    daysOverdue: Number(r.daysOverdue),
    clientName: r.clientName,
    clientPhone: r.clientPhone,
    saleNumber: r.saleNumber,
    standNumber: r.standNumber,
    developmentName: r.developmentName,
    developmentId: r.developmentId,
  }));
}

/** Summary stats for aging report KPIs */
export async function getInstallmentAgingSummary() {
  const overdueFilter = and(
    sql`${installments.dueDate} < now()`,
    sql`${installments.amountPaid}::numeric < ${installments.amountDue}::numeric`,
    eq(sales.status, "ACTIVE"),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseJoin = (qb: any) =>
    qb
      .from(installments)
      .innerJoin(installmentPlans, eq(installments.planId, installmentPlans.id))
      .innerJoin(sales, eq(installmentPlans.saleId, sales.id));

  // Total overdue amount
  const [totalOverdue] = await baseJoin(db.select({ total: sql<string>`coalesce(sum(${installments.amountDue}::numeric - ${installments.amountPaid}::numeric), 0)` })).where(overdueFilter);

  // Count of overdue installments
  const [overdueCount] = await baseJoin(db.select({ count: count() })).where(overdueFilter);

  // Count of unique clients with overdue installments
  const [atRiskClients] = await baseJoin(
    db.select({ count: sql<number>`count(distinct ${sales.clientId})` }),
  ).where(overdueFilter);

  // Count of unique developments affected
  const [affectedDevs] = await baseJoin(
    db.select({ count: sql<number>`count(distinct ${sales.developmentId})` }),
  ).where(overdueFilter);

  return {
    totalOverdue: parseFloat(totalOverdue?.total ?? "0"),
    overdueCount: Number(overdueCount?.count ?? 0),
    atRiskClients: Number(atRiskClients?.count ?? 0),
    affectedDevelopments: Number(affectedDevs?.count ?? 0),
  };
}
