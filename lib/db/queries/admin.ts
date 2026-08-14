import { count, eq, sql } from "drizzle-orm";
import { db, canUseDatabase } from "@/lib/db";
import { agentRankings, aging, executiveStats, monthlyRevenue } from "@/lib/dashboard-data";
import {
  accounts,
  agentProfiles,
  commissions,
  clients,
  developments,
  payments,
  reservations,
  sales,
  stands,
  users,
} from "@/lib/db/schema";

export async function getExecutiveStats() {
  if (!canUseDatabase()) return executiveStats;

  const [devCount] = await db.select({ count: count() }).from(developments);
  const [standCounts] = await db
    .select({
      total: count(),
      available: sql<number>`sum(case when status = 'AVAILABLE' then 1 else 0 end)`,
      presale: sql<number>`sum(case when status = 'PRESALE' then 1 else 0 end)`,
      reserved: sql<number>`sum(case when status = 'RESERVED' then 1 else 0 end)`,
      sold: sql<number>`sum(case when status = 'SOLD' then 1 else 0 end)`,
    })
    .from(stands);

  const [revStats] = await db
    .select({
      totalRevenue: sql<string>`coalesce(sum(purchase_price), 0)`,
      outstanding: sql<string>`coalesce(sum(outstanding_balance), 0)`,
    })
    .from(sales)
    .where(eq(sales.status, "ACTIVE"));

  const [commissionLiability] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(commissions)
    .where(eq(commissions.status, "PENDING"));

  const [depositCollected] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "VERIFIED"));

  const totalRev = parseFloat(revStats?.totalRevenue ?? "0");
  const outstanding = parseFloat(revStats?.outstanding ?? "0");
  const collected = parseFloat(depositCollected?.total ?? "0");

  return {
    developments: devCount?.count ?? 0,
    totalStands: Number(standCounts?.total ?? 0),
    available: Number(standCounts?.available ?? 0),
    presales: Number(standCounts?.presale ?? 0),
    reserved: Number(standCounts?.reserved ?? 0),
    sold: Number(standCounts?.sold ?? 0),
    revenue: totalRev,
    outstanding,
    collectionEfficiency: totalRev > 0 ? (totalRev - outstanding) / totalRev : 0,
    commissionLiability: parseFloat(commissionLiability?.total ?? "0"),
    depositsCollected: collected,
  };
}

export async function getAgentRankings() {
  if (!canUseDatabase()) return agentRankings;

  const rows = await db
    .select({
      agentId: sales.agentId,
      salesCount: count(sales.id),
      revenue: sql<string>`coalesce(sum(${sales.purchasePrice}), 0)`,
      commission: sql<string>`coalesce(sum(${commissions.amount}), 0)`,
    })
    .from(sales)
    .leftJoin(commissions, eq(commissions.saleId, sales.id))
    .groupBy(sales.agentId)
    .orderBy(sql`sum(${sales.purchasePrice}) desc`)
    .limit(10);

  const enriched = await Promise.all(
    rows.map(async (row) => {
      if (!row.agentId) return null;
      const agent = await db.query.agentProfiles.findFirst({
        where: eq(agentProfiles.id, row.agentId),
        with: { user: true },
      });
      return {
        name: agent?.user?.name ?? "Unknown Agent",
        sales: row.salesCount,
        revenue: parseFloat(row.revenue),
        commission: parseFloat(row.commission),
        leads: 0,
      };
    })
  );

  return enriched.filter(Boolean);
}

export async function getMonthlyRevenue() {
  if (!canUseDatabase()) {
    return monthlyRevenue.map((row) => ({
      month: row.month,
      revenue: String(row.revenue),
      collections: String(row.collections),
    }));
  }

  return db
    .select({
      month: sql<string>`to_char(${sales.createdAt}, 'Mon')`,
      revenue: sql<string>`coalesce(sum(${sales.purchasePrice}), 0)`,
      collections: sql<string>`coalesce(sum(${sales.depositPaid}), 0)`,
    })
    .from(sales)
    .groupBy(sql`to_char(${sales.createdAt}, 'Mon'), date_trunc('month', ${sales.createdAt})`)
    .orderBy(sql`date_trunc('month', ${sales.createdAt})`)
    .limit(12);
}

export async function getAgingReport() {
  if (!canUseDatabase()) return aging;

  return [
    {
      bucket: "Current",
      amount: await getAgingBucket(0, 30),
    },
    {
      bucket: "30 Days",
      amount: await getAgingBucket(30, 60),
    },
    {
      bucket: "60 Days",
      amount: await getAgingBucket(60, 90),
    },
    {
      bucket: "90 Days",
      amount: await getAgingBucket(90, 120),
    },
    {
      bucket: "120+ Days",
      amount: await getAgingBucket(120, 9999),
    },
  ];
}

async function getAgingBucket(minDays: number, maxDays: number): Promise<number> {
  const [result] = await db
    .select({ total: sql<string>`coalesce(sum(${sales.outstandingBalance}), 0)` })
    .from(sales)
    .where(
      sql`${sales.status} = 'ACTIVE'
        and extract(day from now() - ${sales.activatedAt}) >= ${minDays}
        and extract(day from now() - ${sales.activatedAt}) < ${maxDays}`
    );
  return parseFloat(result?.total ?? "0");
}

export async function getAdminInventoryStats() {
  return db.query.developments.findMany({
    with: { stands: true },
    orderBy: (d, { asc }) => [asc(d.name)],
  });
}

export async function getAllUsers() {
  if (!canUseDatabase()) return [];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      hasPassword: accounts.password,
    })
    .from(users)
    .leftJoin(accounts, eq(accounts.userId, users.id))
    .orderBy(users.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    emailVerified: r.emailVerified,
    phone: r.phone,
    role: r.role,
    createdAt: r.createdAt,
    inviteStatus: r.emailVerified || r.hasPassword ? "ACTIVE" : "PENDING" as "ACTIVE" | "PENDING",
  }));
}

export async function updateUserRole(userId: string, role: "PUBLIC" | "CLIENT" | "AGENT" | "ACCOUNTS" | "ADMINISTRATOR" | "CEO" | "SYSTEM_ADMIN" | "GROUP_ADMIN") {
  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export type HealthCheck = {
  name: string;
  description: string;
  pass: boolean;
  detail: string;
};

export async function getSystemHealth(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // 1. Environment — critical secrets present
  const envChecks: Array<[string, string | undefined, string]> = [
    ["DATABASE_URL", process.env.DATABASE_URL, "Neon/Postgres connection string"],
    ["AUTH_SECRET", process.env.AUTH_SECRET, "Session signing key"],
    ["RESEND_API_KEY", process.env.RESEND_API_KEY, "Transactional email key"],
    ["CRON_SECRET", process.env.CRON_SECRET, "Reservation-expiry cron guard"],
    ["UPLOADTHING_TOKEN", process.env.UPLOADTHING_TOKEN, "Document upload token"],
  ];
  for (const [key, val, desc] of envChecks) {
    checks.push({
      name: key,
      description: desc,
      pass: Boolean(val),
      detail: val ? "Set" : "Missing — set in .env.local / Railway variables",
    });
  }

  if (!canUseDatabase()) {
    checks.push({
      name: "Database connectivity",
      description: "Can the app reach the database?",
      pass: false,
      detail: "DATABASE_URL not set — all DB checks skipped",
    });
    return checks;
  }

  // 2. Database connectivity
  try {
    await db.select({ one: sql<number>`1` }).from(users).limit(1);
    checks.push({ name: "Database connectivity", description: "Can the app reach the database?", pass: true, detail: "Query succeeded" });
  } catch (e) {
    checks.push({ name: "Database connectivity", description: "Can the app reach the database?", pass: false, detail: String(e) });
    return checks;
  }

  // 3. Active developments
  const [devRow] = await db.select({ n: count() }).from(developments).where(eq(developments.active, true));
  const devCount = devRow?.n ?? 0;
  checks.push({
    name: "Active developments",
    description: "At least one published development for clients to browse",
    pass: devCount > 0,
    detail: devCount > 0 ? `${devCount} active` : "No active developments — publish one in /admin/developments",
  });

  // 4. Active agent profiles
  const [agentRow] = await db.select({ n: count() }).from(agentProfiles).where(eq(agentProfiles.active, true));
  const agentCount = agentRow?.n ?? 0;
  checks.push({
    name: "Active agent profiles",
    description: "At least one agent can submit presales",
    pass: agentCount > 0,
    detail: agentCount > 0 ? `${agentCount} active agent${agentCount !== 1 ? "s" : ""}` : "No active agents — assign AGENT role to a user",
  });

  // 5. Admin / accounts user
  const [adminRow] = await db
    .select({ n: count() })
    .from(users)
    .where(sql`role IN ('ADMINISTRATOR','SYSTEM_ADMIN','ACCOUNTS')`);
  const adminCount = adminRow?.n ?? 0;
  checks.push({
    name: "Admin / accounts users",
    description: "At least one user can approve reservations and manage finances",
    pass: adminCount > 0,
    detail: adminCount > 0 ? `${adminCount} privileged user${adminCount !== 1 ? "s" : ""}` : "No admin users — update a user's role in /admin/users",
  });

  // 6. Pending commissions (informational — not a pass/fail)
  const [commRow] = await db.select({ n: count() }).from(commissions).where(eq(commissions.status, "PENDING"));
  const pendingComm = commRow?.n ?? 0;
  checks.push({
    name: "Pending commissions",
    description: "Commissions awaiting approval (informational)",
    pass: true,
    detail: pendingComm === 0 ? "No pending commissions" : `${pendingComm} awaiting approval — review in /admin/reservations`,
  });

  // 7. Reservation queue
  const [resRow] = await db
    .select({ n: count() })
    .from(reservations)
    .where(sql`status IN ('PENDING','PRESALE','AWAITING_DEPOSIT')`);
  const activeRes = resRow?.n ?? 0;
  checks.push({
    name: "Reservation queue",
    description: "Open reservations needing action (informational)",
    pass: true,
    detail: activeRes === 0 ? "Queue empty" : `${activeRes} reservation${activeRes !== 1 ? "s" : ""} in progress`,
  });

  // 8. Reservation expiry cron
  checks.push({
    name: "Reservation expiry cron",
    description: "Automatic expiry of stale reservations at /api/cron/expire-reservations",
    pass: Boolean(process.env.CRON_SECRET),
    detail: process.env.CRON_SECRET
      ? "CRON_SECRET set — configure Railway cron to call the endpoint"
      : "CRON_SECRET missing — expired reservations will not auto-cancel",
  });

  // 9. Data quality checks
  const [staleBalanceRow] = await db.select({ n: sql<number>`count(*)` }).from(sql`(
    select s.id
    from sales s
    left join payments p on p.sale_id = s.id and p.status = 'VERIFIED' and p.type <> 'ADJUSTMENT'
    group by s.id, s.purchase_price, s.deposit_paid, s.outstanding_balance
    having abs(
      greatest(0, s.purchase_price::numeric - greatest(s.deposit_paid::numeric, coalesce(sum(p.amount::numeric), 0)))
      - s.outstanding_balance::numeric
    ) > 0.01
  ) stale_balances`);
  const staleBalances = Number(staleBalanceRow?.n ?? 0);
  checks.push({
    name: "Sale balance reconciliation",
    description: "Stored balances match verified payment ledger",
    pass: staleBalances === 0,
    detail: staleBalances === 0 ? "No stale balances found" : `${staleBalances} sale balance${staleBalances === 1 ? "" : "s"} need reconciliation`,
  });

  const [partialOverdueRow] = await db.select({ n: count() }).from(sql`installments i
    inner join installment_plans ip on ip.id = i.plan_id
    inner join sales s on s.id = ip.sale_id`)
    .where(sql`i.due_date < now() and i.amount_paid::numeric > 0 and i.amount_paid::numeric < i.amount_due::numeric and s.status = 'ACTIVE'`);
  const partialOverdue = Number(partialOverdueRow?.n ?? 0);
  checks.push({
    name: "Partial overdue installments",
    description: "Partially paid overdue installments are visible in aging reports",
    pass: true,
    detail: partialOverdue === 0 ? "None currently partial-overdue" : `${partialOverdue} partial-overdue installment${partialOverdue === 1 ? "" : "s"} currently tracked`,
  });

  const [clientsWithoutUsersRow] = await db.select({ n: count() }).from(clients).where(sql`user_id is null`);
  const clientsWithoutUsers = Number(clientsWithoutUsersRow?.n ?? 0);
  checks.push({
    name: "Client login accounts",
    description: "Clients have portal user accounts",
    pass: clientsWithoutUsers === 0,
    detail: clientsWithoutUsers === 0 ? "Every client is linked to a user" : `${clientsWithoutUsers} client${clientsWithoutUsers === 1 ? "" : "s"} missing login accounts`,
  });

  const [duplicateEmailRow] = await db.select({ n: sql<number>`count(*)` }).from(sql`(
    select lower(email)
    from clients
    group by lower(email)
    having count(*) > 1
  ) duplicate_client_emails`);
  const duplicateEmails = Number(duplicateEmailRow?.n ?? 0);
  checks.push({
    name: "Duplicate client emails",
    description: "Client records should not share the same email",
    pass: duplicateEmails === 0,
    detail: duplicateEmails === 0 ? "No duplicate client emails" : `${duplicateEmails} duplicate email group${duplicateEmails === 1 ? "" : "s"}`,
  });

  const [orphanReservedStandRow] = await db.select({ n: sql<number>`count(*)` }).from(sql`stands st
    left join reservations r on r.stand_id = st.id and r.status in ('PENDING','PRESALE','AWAITING_DEPOSIT','APPROVED')
    left join sales sa on sa.stand_id = st.id and sa.status in ('ACTIVE','PAID_OFF')`)
    .where(sql`st.status = 'RESERVED' and r.id is null and sa.id is null`);
  const orphanReserved = Number(orphanReservedStandRow?.n ?? 0);
  checks.push({
    name: "Reserved stand ownership",
    description: "Reserved stands have an active reservation or sale",
    pass: orphanReserved === 0,
    detail: orphanReserved === 0 ? "No orphan reserved stands" : `${orphanReserved} reserved stand${orphanReserved === 1 ? "" : "s"} have no active owner record`,
  });

  return checks;
}
