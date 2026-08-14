import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { DashboardAlerts } from "@/components/dashboard-alerts";
import { EmptyState, SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { money } from "@/lib/utils";
import { getReservationsAwaitingDeposit } from "@/lib/db/queries/reservations";
import { getAllPayments } from "@/lib/db/queries/payments";
import { getAllClients, getAllClientsWithRecords } from "@/lib/db/queries/clients";
import { getAllSales } from "@/lib/db/queries/sales";
import { getAvailableStands } from "@/lib/db/queries/stands";
import {
  rejectReservation,
  verifyPayment,
  rejectPayment,
} from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { DepositForm } from "./_deposit-form";
import { ClientDirectory } from "./clients/_client-directory";
import { RecordPaymentForm } from "./payments/_record-payment-form";
import { DirectSaleForm } from "./_direct-sale-form";

export const dynamic = "force-dynamic";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const [awaitingReservations, allPayments, clients, sales, clientsWithRecords, availableStands] = await Promise.all([
    getReservationsAwaitingDeposit(),
    getAllPayments(),
    getAllClients(),
    getAllSales(),
    getAllClientsWithRecords(),
    getAvailableStands(),
  ]);

  const { q, tab } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const activeTab = tab === "clients" ? "clients" : "overview";

  const activeSalesForForm = sales
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      clientId: s.clientId,
      clientName: s.client?.name ?? "—",
      standNumber: s.stand?.standNumber ?? "—",
      outstanding: parseFloat(s.outstandingBalance as string),
    }));

  const awaitingDeposit = awaitingReservations
    .map((r) => ({
      id: r.id,
      reference: r.reference,
      client: r.client?.name ?? "—",
      development: r.development?.name ?? "—",
      stand: r.stand?.standNumber ?? "—",
      deposit: parseFloat(r.development?.depositAmount ?? r.stand?.price ?? "0"),
      agent: r.agent?.user?.name ?? "—",
      agentEmail: r.agent?.user?.email ?? null,
      status: r.status === "AWAITING_DEPOSIT" ? "Awaiting Deposit" : r.status,
    }))
    .filter(
      (p) =>
        !query ||
        p.client.toLowerCase().includes(query) ||
        p.reference.toLowerCase().includes(query) ||
        p.development.toLowerCase().includes(query),
    );

  const pendingPayments = allPayments
    .filter((p) => p.status === "PENDING")
    .filter(
      (p) =>
        !query ||
        (p.client?.name ?? "").toLowerCase().includes(query) ||
        p.reference.toLowerCase().includes(query),
    );

  const exposure = awaitingReservations.reduce((sum, p) => sum + parseFloat(p.development?.depositAmount ?? p.stand?.price ?? "0"), 0);

  const verifiedThisMonth = allPayments
    .filter((p) => {
      const d = new Date(p.paidAt);
      const now = new Date();
      return (
        p.status === "VERIFIED" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const activeSales = sales.filter((s) => s.status === "ACTIVE").length;
  const kycComplete = clients.filter((c) => c.kycStatus === "COMPLETE").length;
  const pendingPaymentTotal = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const incompleteKyc = clients.length - kycComplete;
  const accountsAlerts = [
    ...(pendingPayments.length > 0 ? [{
      title: `${pendingPayments.length} payments need review`,
      detail: `${money(pendingPaymentTotal)} is waiting for approval or rejection.`,
      href: "/accounts/payments?status=PENDING",
      label: "Review",
      tone: "warning" as const,
    }] : []),
    ...(awaitingDeposit.length > 0 ? [{
      title: `${awaitingDeposit.length} presales are awaiting deposit`,
      detail: `${money(exposure)} is reserved but not yet converted to paid deposits.`,
      href: "/accounts",
      label: "Open",
      tone: "info" as const,
    }] : []),
    ...(incompleteKyc > 0 ? [{
      title: `${incompleteKyc} clients still need KYC completion`,
      detail: "Finish identity and proof-of-residence checks before sale documents are finalized.",
      href: "/accounts?tab=clients",
      label: "Clients",
      tone: "warning" as const,
    }] : []),
  ];

  const quickLinks = [
    {
      label: "Clients",
      href: "/accounts/clients",
      icon: Users,
      value: `${kycComplete}/${clients.length} KYC complete`,
    },
    {
      label: "Payments",
      href: "/accounts/payments",
      icon: CreditCard,
      value: `${allPayments.filter((p) => p.status === "PENDING").length} unverified`,
    },
    {
      label: "Revenue Reports",
      href: "/accounts/reports",
      icon: FileText,
      value: `${activeSales} active sales`,
    },
  ];

  return (
    <main className="dashboard-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          eyebrow="Accounts Dashboard"
          title="Deposit verification, presale conversion, and collections"
        >
          Record deposits, verify payments, and convert presales into active sales
          in one place.
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          <DirectSaleForm stands={availableStands} />
          <RecordPaymentForm sales={activeSalesForForm} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-b">
        <Link
          href="/accounts"
          className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </Link>
        <Link
          href="/accounts?tab=clients"
          className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
            activeTab === "clients"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Clients
        </Link>
      </div>

      {activeTab === "clients" ? (
        <section className="premium-panel mt-6">
          <div className="border-b px-5 py-4">
            <h2 className="text-xl font-semibold">Client Directory</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Search all {clientsWithRecords.length} clients and download statements, invoices, or receipts.
            </p>
          </div>
          <div className="p-5">
            <ClientDirectory clients={clientsWithRecords} />
          </div>
        </section>
      ) : (
      <>
      <DashboardAlerts alerts={accountsAlerts} className="mt-6" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Awaiting Deposit"
          value={String(awaitingDeposit.length)}
          detail={`${money(exposure)} exposure`}
        />
        <StatCard
          label="Pending Verification"
          value={String(pendingPayments.length)}
          detail={`${money(pendingPaymentTotal)} unverified`}
        />
        <StatCard
          label="Verified This Month"
          value={money(verifiedThisMonth)}
          detail={String(allPayments.filter(p => p.status === "VERIFIED").length) + " total verified"}
        />
        <StatCard
          label="Active Sales"
          value={String(activeSales)}
          detail={`${kycComplete} clients KYC complete`}
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {quickLinks.map((ql) => (
          <Link
            key={ql.href}
            href={ql.href}
            className="premium-panel flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ql.icon className="size-8 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{ql.label}</p>
              <p className="truncate text-sm text-muted-foreground">{ql.value}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <section className="premium-panel mt-10">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Banknote className="size-5 text-primary" />
            Presales Awaiting Deposit
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {awaitingDeposit.length} pending
            </span>
            <Link
              href="/api/reports/reservations/csv"
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Download className="size-3.5" />
              CSV
            </Link>
            <form method="GET" className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Filter…"
                className="h-8 w-48 rounded-lg border bg-background pl-8 pr-2.5 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>
          </div>
        </div>

        {awaitingDeposit.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No presales awaiting deposit"
              detail="New presales created by agents will appear here for deposit verification."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {awaitingDeposit.map((presale) => (
                  <tr key={presale.reference} className="border-t hover:bg-muted/30">
                    <td className="kpi-number px-4 py-3 font-semibold">
                      {presale.reference}
                    </td>
                    <td className="px-4 py-3">{presale.client}</td>
                    <td className="px-4 py-3">{presale.development}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">
                      {presale.stand}
                    </td>
                    <td className="kpi-number px-4 py-3">
                      {money(presale.deposit)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {presale.agent}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={presale.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DepositForm
                          reservationId={presale.id}
                          defaultAmount={presale.deposit}
                        />
                        <ActionButton
                          action={rejectReservation.bind(null, presale.id)}
                          successMsg="Presale rejected"
                          successDesc={`${presale.reference} has been cancelled.`}
                          className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          <XCircle className="size-3.5" />
                          Reject
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <CreditCard className="size-5 text-primary" />
            Pending Payment Verification
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {pendingPayments.length} unverified
            </span>
            <form method="GET" className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Filter…"
                className="h-8 w-48 rounded-lg border bg-background pl-8 pr-2.5 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>
          </div>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No pending payments"
              detail="All payments have been verified. New payments submitted by clients will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="kpi-number px-4 py-3 font-medium">
                      {p.reference}
                    </td>
                    <td className="px-4 py-3">{p.client?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${
                          p.type === "DEPOSIT"
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                            : p.type === "INSTALLMENT"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {p.type === "DEPOSIT"
                          ? "Deposit"
                          : p.type === "INSTALLMENT"
                            ? "Installment"
                            : "Admin Fee"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.method.replace(/_/g, " ")}
                    </td>
                    <td className="kpi-number px-4 py-3 font-semibold">
                      {money(parseFloat(p.amount))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.paidAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton
                          action={verifyPayment.bind(null, p.id)}
                          successMsg="Payment verified"
                          successDesc={`${p.reference} has been approved.`}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="size-3" />
                          Verify
                        </ActionButton>
                        <ActionButton
                          action={rejectPayment.bind(null, p.id)}
                          successMsg="Payment rejected"
                          successDesc={`${p.reference} has been marked as failed.`}
                          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-800 ring-1 ring-red-200 transition hover:bg-red-100"
                        >
                          <XCircle className="size-3" />
                          Reject
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </>
      )}
    </main>
  );
}
