import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { getSaleFinancialSnapshot } from "@/lib/finance";
import { db } from "@/lib/db";
import { reservations, stands, sales, developments, groups, clients } from "@/lib/db/schema";

export type IntegrityIssue = {
  category: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  href?: string;
};

/**
 * Reservations that closed (EXPIRED/CANCELLED) but whose stand was never
 * released back to AVAILABLE, and isn't held by any other active reservation
 * or sale. This is the exact bug class behind several stuck-stand incidents:
 * `cancelExpiredReservations()` used to flip status without releasing the
 * stand.
 */
async function findStuckReservations(): Promise<IntegrityIssue[]> {
  const closed = await db.query.reservations.findMany({
    where: inArray(reservations.status, ["EXPIRED", "CANCELLED"]),
    with: { stand: true, client: true, development: true },
  });

  const issues: IntegrityIssue[] = [];
  for (const r of closed) {
    if (!r.stand || r.stand.status !== "RESERVED") continue;

    const otherActive = await db.query.reservations.findFirst({
      where: and(
        eq(reservations.standId, r.standId),
        inArray(reservations.status, ["PENDING", "PRESALE", "AWAITING_DEPOSIT", "APPROVED"]),
      ),
    });
    if (otherActive) continue;

    const hasSale = await db.query.sales.findFirst({ where: eq(sales.standId, r.standId) });
    if (hasSale) continue;

    issues.push({
      category: "Stuck stand",
      severity: "high",
      title: `Stand ${r.stand.standNumber} (${r.development?.name ?? "—"}) is locked but its reservation ${r.reference} is ${r.status}`,
      detail: `Client: ${r.client?.name ?? "—"}. No active reservation or sale holds this stand — it should likely be released to AVAILABLE or converted to a sale if the client actually paid.`,
      href: "/admin/reservations",
    });
  }
  return issues;
}

/** Stands marked SOLD with no corresponding sale record. */
async function findSoldStandsWithoutSale(): Promise<IntegrityIssue[]> {
  const soldStands = await db.query.stands.findMany({
    where: eq(stands.status, "SOLD"),
    with: { development: true },
  });

  const issues: IntegrityIssue[] = [];
  for (const s of soldStands) {
    const sale = await db.query.sales.findFirst({ where: eq(sales.standId, s.id) });
    if (sale) continue;
    issues.push({
      category: "Orphaned SOLD stand",
      severity: "high",
      title: `Stand ${s.standNumber} (${s.development?.name ?? "—"}) is marked SOLD with no sale record`,
      detail: "No row in the sales table references this stand. Either the sale was never recorded, or the stand status was set incorrectly.",
      href: "/sysadmin/sales",
    });
  }
  return issues;
}

/** Active sales with zero deposit ever recorded — unusual for a converted presale. */
async function findSalesWithNoDeposit(): Promise<IntegrityIssue[]> {
  const rows = await db.query.sales.findMany({
    where: and(eq(sales.status, "ACTIVE"), eq(sales.depositPaid, "0")),
    with: { client: true, stand: true, development: true },
  });
  return rows.map((s) => ({
    category: "Sale with no deposit",
    severity: "medium" as const,
    title: `${s.saleNumber} — ${s.client?.name ?? "—"} — Stand ${s.stand?.standNumber ?? "—"} (${s.development?.name ?? "—"})`,
    detail: "This active sale shows $0 deposit paid. Confirm a deposit was actually received before treating this as a genuine sale.",
    href: "/sysadmin/sales",
  }));
}

/**
 * AVAILABLE stands whose price no longer matches sizeSqm × the
 * development's current price-per-sqm — a sign a rate change didn't get
 * applied to every stand (or was applied only partially).
 */
async function findStalePrices(): Promise<IntegrityIssue[]> {
  const devs = await db.query.developments.findMany();
  const issues: IntegrityIssue[] = [];

  for (const dev of devs) {
    const pricePerSqm = parseFloat(dev.pricePerSqm);
    if (!pricePerSqm) continue;

    const availableStands = await db.query.stands.findMany({
      where: and(eq(stands.developmentId, dev.id), eq(stands.status, "AVAILABLE")),
    });

    for (const s of availableStands) {
      const expected = Math.round(s.sizeSqm * pricePerSqm * 100) / 100;
      const actual = parseFloat(s.price);
      if (Math.abs(expected - actual) > 0.5) {
        issues.push({
          category: "Stale stand price",
          severity: "medium",
          title: `Stand ${s.standNumber} (${dev.name}) priced at $${actual.toFixed(2)}, expected $${expected.toFixed(2)}`,
          detail: `Development is currently $${pricePerSqm}/sqm × ${s.sizeSqm} sqm = $${expected.toFixed(2)}, but this stand's stored price doesn't match.`,
          href: `/developments/${dev.slug}`,
        });
      }
    }
  }
  return issues;
}

/** Archived or soft-deleted developments that still have an ACTIVE sale — archiving/deleting should not silently orphan a collections workflow. */
async function findArchivedDevelopmentsWithActiveSales(): Promise<IntegrityIssue[]> {
  const closedDevs = await db.query.developments.findMany({
    where: and(
      isNotNull(developments.archivedAt),
    ),
  });
  const deletedDevs = await db.query.developments.findMany({
    where: isNotNull(developments.deletedAt),
  });
  const all = [...closedDevs, ...deletedDevs.filter((d) => !closedDevs.some((c) => c.id === d.id))];

  const issues: IntegrityIssue[] = [];
  for (const dev of all) {
    const activeSale = await db.query.sales.findFirst({
      where: and(eq(sales.developmentId, dev.id), eq(sales.status, "ACTIVE")),
    });
    if (!activeSale) continue;
    issues.push({
      category: "Archived development with active sale",
      severity: "high",
      title: `${dev.name} is ${dev.deletedAt ? "deleted" : "archived"} but has at least one ACTIVE sale`,
      detail: "Archiving or deleting a development should not happen while it still has active collections in progress. Restore it, or confirm the sale has been reassigned/closed out.",
      href: "/admin/developments",
    });
  }
  return issues;
}

/** Archived or soft-deleted stands that still hold an active reservation or sale — archiving a stand should not silently orphan a live collections workflow. */
async function findArchivedStandsStillReferenced(): Promise<IntegrityIssue[]> {
  const closedStands = await db.query.stands.findMany({
    where: isNotNull(stands.archivedAt),
    with: { development: true },
  });
  const deletedStands = await db.query.stands.findMany({
    where: isNotNull(stands.deletedAt),
    with: { development: true },
  });
  const all = [...closedStands, ...deletedStands.filter((s) => !closedStands.some((c) => c.id === s.id))];

  const issues: IntegrityIssue[] = [];
  for (const s of all) {
    const activeSale = await db.query.sales.findFirst({ where: and(eq(sales.standId, s.id), eq(sales.status, "ACTIVE")) });
    const activeReservation = await db.query.reservations.findFirst({
      where: and(eq(reservations.standId, s.id), inArray(reservations.status, ["PENDING", "PRESALE", "AWAITING_DEPOSIT", "APPROVED"])),
    });
    if (!activeSale && !activeReservation) continue;
    issues.push({
      category: "Archived stand still referenced",
      severity: "high",
      title: `Stand ${s.standNumber} (${s.development?.name ?? "—"}) is ${s.deletedAt ? "deleted" : "archived"} but has ${activeSale ? "an ACTIVE sale" : "an active reservation"}`,
      detail: "Archiving or deleting a stand should not happen while it still has a live sale or reservation. Restore it, or confirm the sale/reservation has been closed out.",
      href: "/admin/stands",
    });
  }
  return issues;
}

/** Stands transferred to a new owner whose previous sale wasn't properly cancelled — the exact failure mode transferStandAction's cancel-then-recreate flow must avoid. */
async function findTransferredStandsWithOrphanedOldSale(): Promise<IntegrityIssue[]> {
  const soldStands = await db.query.stands.findMany({
    where: eq(stands.status, "SOLD"),
    with: { development: true },
  });

  const issues: IntegrityIssue[] = [];
  for (const s of soldStands) {
    const activeSales = await db.query.sales.findMany({
      where: and(eq(sales.standId, s.id), inArray(sales.status, ["ACTIVE", "PAID_OFF"])),
    });
    if (activeSales.length <= 1) continue;
    issues.push({
      category: "Stand with multiple active sales",
      severity: "high",
      title: `Stand ${s.standNumber} (${s.development?.name ?? "—"}) has ${activeSales.length} active/paid-off sales`,
      detail: "A transfer should cancel the previous sale before creating a new one. This stand has more than one non-cancelled sale record — confirm which is genuine and cancel the rest.",
      href: "/sysadmin/sales",
    });
  }
  return issues;
}

/** Active groups with no group administrator assigned — the group's members have no self-service login/oversight. */
async function findGroupsWithoutActiveAdmin(): Promise<IntegrityIssue[]> {
  const rows = await db.query.groups.findMany({
    where: and(eq(groups.status, "ACTIVE"), isNull(groups.groupAdminUserId)),
    with: { development: true },
  });
  return rows.map((g) => ({
    category: "Group without an administrator",
    severity: "medium" as const,
    title: `${g.name} (${g.development?.name ?? "—"}) is active with no group administrator assigned`,
    detail: "Invite a group administrator so members can be managed and collections tracked.",
    href: "/admin/groups",
  }));
}

async function findMissingClientKyc(): Promise<IntegrityIssue[]> {
  const rows = await db.query.clients.findMany({
    with: { reservations: true, sales: true },
  });
  return rows
    .filter((client) =>
      client.reservations.length > 0 ||
      client.sales.length > 0 ||
      client.kycStatus !== "COMPLETE"
    )
    .filter((client) =>
      client.kycStatus !== "COMPLETE" ||
      !client.nationalIdFrontUrl ||
      !client.nationalIdBackUrl ||
      !client.proofOfResidenceUrl
    )
    .slice(0, 40)
    .map((client) => ({
      category: "Missing KYC",
      severity: "medium" as const,
      title: client.name + " has incomplete KYC",
      detail: "Client has an active record or incomplete KYC status, but one or more required identity/proof-of-residence uploads are missing.",
      href: "/accounts?tab=clients",
    }));
}

async function findClientsWithoutLoginAccounts(): Promise<IntegrityIssue[]> {
  const rows = await db.query.clients.findMany({
    where: isNull(clients.userId),
    with: { reservations: true, sales: true },
  });
  return rows
    .filter((client) => client.reservations.length > 0 || client.sales.length > 0)
    .slice(0, 40)
    .map((client) => ({
      category: "Client login missing",
      severity: "medium" as const,
      title: client.name + " has no portal login",
      detail: "Client has reservation or sale activity but no linked user account, so they cannot access statements, receipts, payment uploads, or status updates.",
      href: "/admin/users",
    }));
}

async function findDuplicateClientEmails(): Promise<IntegrityIssue[]> {
  const rows = await db.query.clients.findMany();
  const byEmail = new Map<string, typeof rows>();
  for (const client of rows) {
    const email = client.email.trim().toLowerCase();
    if (!email) continue;
    byEmail.set(email, [...(byEmail.get(email) ?? []), client]);
  }
  return Array.from(byEmail.entries())
    .filter(([, matches]) => matches.length > 1)
    .slice(0, 25)
    .map(([email, matches]) => ({
      category: "Duplicate email",
      severity: "medium" as const,
      title: String(matches.length) + " client records share " + email,
      detail: matches.map((client) => client.name).join(", "),
      href: "/accounts?tab=clients",
    }));
}

async function findSalesWithoutInstallments(): Promise<IntegrityIssue[]> {
  const rows = await db.query.sales.findMany({
    where: eq(sales.status, "ACTIVE"),
    with: { client: true, stand: true, development: true, installmentPlan: true },
  });
  return rows
    .filter((sale) => !sale.installmentPlan && parseFloat(sale.outstandingBalance) > 0.01)
    .map((sale) => ({
      category: "Missing installment plan",
      severity: "high" as const,
      title: sale.saleNumber + " has an outstanding balance but no installments",
      detail: (sale.client?.name ?? "—") + " · Stand " + (sale.stand?.standNumber ?? "—") + " · " + (sale.development?.name ?? "—") + ". Collections cannot age this sale accurately without installments.",
      href: "/sysadmin/sales",
    }));
}

async function findActiveReservationsWithoutExpiry(): Promise<IntegrityIssue[]> {
  const rows = await db.query.reservations.findMany({
    where: and(inArray(reservations.status, ["PENDING", "PRESALE", "AWAITING_DEPOSIT"]), isNull(reservations.expiresAt)),
    with: { client: true, stand: true, development: true },
  });
  return rows.map((reservation) => ({
    category: "Reservation expiry missing",
    severity: "medium" as const,
    title: reservation.reference + " has no expiry date",
    detail: (reservation.client?.name ?? "—") + " · Stand " + (reservation.stand?.standNumber ?? "—") + " · " + (reservation.development?.name ?? "—") + ". Reservations without expiry can lock stands indefinitely.",
    href: "/admin/reservations",
  }));
}

async function findBalanceMismatches(): Promise<IntegrityIssue[]> {
  const rows = await db.query.sales.findMany({
    where: eq(sales.status, "ACTIVE"),
    with: { client: true, stand: true, development: true, payments: true },
  });
  return rows
    .map((sale) => ({ sale, snapshot: getSaleFinancialSnapshot(sale) }))
    .filter(({ snapshot }) => snapshot.isReconciledFromLedger)
    .map(({ sale, snapshot }) => ({
      category: "Balance mismatch",
      severity: "high" as const,
      title: sale.saleNumber + " stored balance differs from verified payments",
      detail: (sale.client?.name ?? "—") + " · Stand " + (sale.stand?.standNumber ?? "—") + ". Stored outstanding is $" + snapshot.storedOutstanding.toFixed(2) + ", ledger outstanding is $" + snapshot.ledgerOutstanding.toFixed(2) + ".",
      href: "/sysadmin/sales",
    }));
}

async function findInvalidDevelopmentImages(): Promise<IntegrityIssue[]> {
  const rows = await db.query.developments.findMany();
  return rows
    .filter((development) => {
      const url = development.heroImage?.trim();
      return !url || !(url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:"));
    })
    .map((development) => ({
      category: "Broken image URL",
      severity: "medium" as const,
      title: development.name + " has an invalid hero image path",
      detail: "Hero image must be an uploaded local path, absolute URL, or data URL. Public pages may show a broken image until this is fixed.",
      href: "/admin/developments",
    }));
}

/** Group members (clients tagged with a groupId) who have never had a reservation or sale — flags an import that never got followed up with stand assignment. */
async function findGroupMembersWithoutReservation(): Promise<IntegrityIssue[]> {
  const members = await db.query.clients.findMany({
    where: isNotNull(clients.groupId),
    with: { reservations: true, sales: true, group: true },
  });
  const issues: IntegrityIssue[] = [];
  for (const m of members) {
    if (m.reservations.length > 0 || m.sales.length > 0) continue;
    issues.push({
      category: "Unallocated group member",
      severity: "medium",
      title: `${m.name} is a member of ${m.group?.name ?? "a group"} with no stand reservation or sale`,
      detail: "This member was imported but never assigned a stand. Complete their allocation or confirm they're intentionally unassigned.",
      href: "/admin/groups",
    });
  }
  return issues;
}

export async function getDataIntegrityIssues(): Promise<IntegrityIssue[]> {
  const [
    stuck,
    orphanedSold,
    noDeposit,
    stalePrices,
    archivedWithSales,
    archivedStands,
    orphanedTransfers,
    groupsWithoutAdmin,
    unallocatedMembers,
    missingKyc,
    missingLogins,
    duplicateEmails,
    missingInstallments,
    reservationsWithoutExpiry,
    balanceMismatches,
    invalidImages,
  ] = await Promise.all([
    findStuckReservations(),
    findSoldStandsWithoutSale(),
    findSalesWithNoDeposit(),
    findStalePrices(),
    findArchivedDevelopmentsWithActiveSales(),
    findArchivedStandsStillReferenced(),
    findTransferredStandsWithOrphanedOldSale(),
    findGroupsWithoutActiveAdmin(),
    findGroupMembersWithoutReservation(),
    findMissingClientKyc(),
    findClientsWithoutLoginAccounts(),
    findDuplicateClientEmails(),
    findSalesWithoutInstallments(),
    findActiveReservationsWithoutExpiry(),
    findBalanceMismatches(),
    findInvalidDevelopmentImages(),
  ]);
  return [
    ...stuck,
    ...orphanedSold,
    ...missingInstallments,
    ...balanceMismatches,
    ...noDeposit,
    ...stalePrices,
    ...archivedWithSales,
    ...archivedStands,
    ...orphanedTransfers,
    ...groupsWithoutAdmin,
    ...unallocatedMembers,
    ...missingKyc,
    ...missingLogins,
    ...duplicateEmails,
    ...reservationsWithoutExpiry,
    ...invalidImages,
  ];
}
