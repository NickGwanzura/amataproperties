import { Suspense } from "react";
import { Check, Download, ExternalLink, X } from "lucide-react";

export const dynamic = "force-dynamic";
import { SectionTitle, StatusBadge } from "@/components/ui";
import { getAllPayments } from "@/lib/db/queries/payments";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { getAllSales } from "@/lib/db/queries/sales";
import { money } from "@/lib/utils";
import { rejectPayment, verifyPayment } from "@/lib/actions";
import { PaymentFilters } from "./_filters";
import { RecordPaymentForm } from "./_record-payment-form";

const typeLabel: Record<string, string> = {
  DEPOSIT: "Deposit",
  INSTALLMENT: "Installment",
  ADJUSTMENT: "Admin Fee",
};

const methodLabel: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ECOCASH: "EcoCash",
  VELOCITY: "Velocity",
  OTHER: "Other",
};

function proofUrlFromNotes(notes?: string | null) {
  const match = notes?.match(/Proof:\s*(https?:\/\/[^\s|]+)/i);
  return match?.[1] ?? null;
}

export default async function AccountsPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ dev?: string; type?: string; status?: string }>;
}) {
  const { dev, type, status } = await searchParams;

  const [allPayments, developments, allSales] = await Promise.all([
    getAllPayments(),
    getAllDevelopmentsWithStandCounts(),
    getAllSales(),
  ]);

  const activeSalesForForm = allSales
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      clientId: s.clientId,
      clientName: s.client?.name ?? "—",
      standNumber: s.stand?.standNumber ?? "—",
      outstanding: parseFloat(s.outstandingBalance as string),
    }));

  // Resolve the development for each payment (may come via sale or reservation)
  const payments = allPayments.map((p) => ({
    ...p,
    development: p.sale?.development ?? p.reservation?.development ?? null,
    stand: p.sale?.stand ?? p.reservation?.stand ?? null,
    proofUrl: proofUrlFromNotes(p.notes),
  }));

  // Apply filters
  const filtered = payments.filter((p) => {
    if (dev && p.development?.id !== dev) return false;
    if (type && p.type !== type) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  const totalVerified = filtered
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPending = filtered
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const pendingReview = payments
    .filter((p) => p.status === "PENDING")
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime());

  const depositCount = filtered.filter((p) => p.type === "DEPOSIT").length;
  const installmentCount = filtered.filter((p) => p.type === "INSTALLMENT").length;

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Accounts: Payments"
        title="Deposits, installments, and receipts"
      />

      {/* Stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Verified", value: money(totalVerified), sub: `${filtered.filter((p) => p.status === "VERIFIED").length} payments` },
          { label: "Awaiting Verification", value: money(totalPending), sub: `${filtered.filter((p) => p.status === "PENDING").length} payments` },
          { label: "Deposits", value: String(depositCount), sub: "receipt available" },
          { label: "Installments", value: String(installmentCount), sub: "velocity / bank" },
        ].map((stat) => (
          <div key={stat.label} className="premium-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold leading-none kpi-number">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {pendingReview.length > 0 ? (
        <section className="premium-panel mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold">Payment Upload Review Queue</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Oldest pending client uploads are shown first for accounts approval.
              </p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {pendingReview.length} pending
            </span>
          </div>
          <div className="divide-y">
            {pendingReview.slice(0, 6).map((payment) => (
              <div key={payment.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                <div>
                  <p className="kpi-number text-sm font-semibold">{payment.reference}</p>
                  <p className="mt-0.5 text-sm font-medium">{payment.client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.development?.name ?? "—"} · Stand {payment.stand?.standNumber ?? "—"}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="kpi-number font-semibold">{money(parseFloat(payment.amount))}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabel[payment.type]} · {methodLabel[payment.method]} · {new Date(payment.paidAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {payment.proofUrl ? (
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <ExternalLink className="size-3" /> View proof
                    </a>
                  ) : (
                    <p className="mt-1 text-xs font-medium text-amber-700">No proof URL captured</p>
                  )}
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <form action={verifyPayment.bind(null, payment.id)}>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Check className="size-3.5" /> Approve
                    </button>
                  </form>
                  <form action={rejectPayment.bind(null, payment.id)}>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <X className="size-3.5" /> Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Filters */}
      <div className="mt-8">
        <Suspense>
          <PaymentFilters
            developments={developments.map((d) => ({ id: d.id, slug: d.slug, name: d.name }))}
          />
        </Suspense>
      </div>

      {/* Table */}
      <section className="premium-panel mt-5">
        <div className="border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Payment Register</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{filtered.length} records</p>
          </div>
          <RecordPaymentForm sales={activeSalesForForm} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Stand</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                    No payments match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(payment.paidAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="kpi-number px-4 py-3 font-medium">{payment.reference}</td>
                    <td className="px-4 py-3">{payment.client.name}</td>
                    <td className="px-4 py-3">{payment.development?.name ?? "—"}</td>
                    <td className="kpi-number px-4 py-3">{payment.stand?.standNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${payment.type === "DEPOSIT" ? "bg-indigo-50 text-indigo-800 border-indigo-200" : payment.type === "INSTALLMENT" ? "bg-sky-50 text-sky-800 border-sky-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                        {typeLabel[payment.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{methodLabel[payment.method]}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(parseFloat(payment.amount))}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status === "VERIFIED" ? "Approved" : payment.status === "PENDING" ? "Pending" : payment.status === "FAILED" ? "Lost" : "Approved"} />
                    </td>
                    <td className="px-4 py-3">
                      {payment.proofUrl ? (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                        >
                          <ExternalLink className="size-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {payment.receiptUrl ? (
                        <a
                          href={payment.receiptUrl}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                        >
                          <Download className="size-3.5" /> PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <form action={verifyPayment.bind(null, payment.id)}>
                            <button
                              type="submit"
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                              title="Approve payment"
                            >
                              <Check className="size-4" />
                            </button>
                          </form>
                          <form action={rejectPayment.bind(null, payment.id)}>
                            <button
                              type="submit"
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                              title="Reject payment"
                            >
                              <X className="size-4" />
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
