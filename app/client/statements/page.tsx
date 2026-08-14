export const dynamic = "force-dynamic";

import { Download, FileText, Receipt, Search } from "lucide-react";
import Link from "next/link";
import { SectionTitle, StatusBadge } from "@/components/ui";
import { getClientByUserId } from "@/lib/db/queries/clients";
import { getSessionUser } from "@/lib/session";
import { money } from "@/lib/utils";
import { getSaleFinancialSnapshot } from "@/lib/finance";

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
function getStatementTotals(sale: NonNullable<Awaited<ReturnType<typeof getClientByUserId>>>["sales"][number]) {
  const finance = getSaleFinancialSnapshot(sale);
  const progress = finance.purchasePrice > 0 ? Math.min(100, Math.round((finance.propertyPaid / finance.purchasePrice) * 100)) : 0;

  return {
    verifiedPayments: sale.payments.filter((p) => p.status === "VERIFIED"),
    adminFees: finance.adminFees,
    totalPaid: finance.propertyPaid,
    outstanding: finance.outstanding,
    progress,
    isLedgerAdjusted: finance.isReconciledFromLedger,
  };
}

export default async function ClientStatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;

  const user = await getSessionUser();
  const client = user ? await getClientByUserId(user.id) : null;
  const sale = client?.sales?.[0] ?? null;

  const totals = sale ? getStatementTotals(sale) : null;
  const verifiedPayments = totals?.verifiedPayments ?? [];

  const filtered = verifiedPayments.filter((p) => {
    if (type && type !== "ALL" && p.type !== type) return false;
    if (q) {
      const search = q.toLowerCase();
      return (
        p.reference.toLowerCase().includes(search) ||
        typeLabel[p.type]?.toLowerCase().includes(search) ||
        methodLabel[p.method]?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Client: Statements & Receipts" title="Download your documents">
        Download your account statement or individual payment receipts. All documents are
        generated live from your payment records.
      </SectionTitle>

      {!sale ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <FileText className="size-12 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No active sale found</p>
          <p className="text-sm text-muted-foreground">Documents will be available once your reservation is converted to a sale.</p>
        </div>
      ) : (
        <>
          <section className="mt-8 premium-panel p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10">
                  <FileText className="size-6 text-primary" />
                </span>
                <div>
                  <p className="font-semibold text-lg">Account Statement</p>
                  <p className="text-sm text-muted-foreground">
                    {sale.saleNumber} · {sale.development?.name} · {sale.stand?.standNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total paid: <strong className="text-foreground">{money(totals?.totalPaid ?? 0)}</strong> ·
                    Outstanding: <strong className="text-foreground">{money(totals?.outstanding ?? 0)}</strong>
                  </p>
                </div>
              </div>
              <div className="min-w-[180px] flex-1 lg:max-w-xs">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Payment progress</span>
                  <span className="font-semibold">{totals?.progress ?? 0}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${totals?.progress ?? 0}%` }} />
                </div>
                {totals?.isLedgerAdjusted && (
                  <p className="mt-1 text-[11px] text-amber-700">Statement totals reconciled from verified payments.</p>
                )}
              </div>
              <a
                href={`/api/client/statement/${sale.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
              >
                <Download className="size-4" />
                Download PDF
              </a>
            </div>
          </section>

          {/* Receipts section */}
          <section className="premium-panel mt-6">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <Receipt className="size-5 text-primary" />
                    Payment Receipts
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {filtered.length} of {verifiedPayments.length} verified payments
                  </p>
                </div>

                {/* Search + filter */}
                <form method="GET" className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      name="q"
                      defaultValue={q ?? ""}
                      placeholder="Search by reference…"
                      className="h-9 w-48 rounded-lg border border-border/70 bg-background pl-8 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <select
                    name="type"
                    defaultValue={type ?? "ALL"}
                    className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary"
                  >
                    <option value="ALL">All Types</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="INSTALLMENT">Installment</option>
                    <option value="ADJUSTMENT">Admin Fee</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    <Search className="size-3.5" />
                    Search
                  </button>
                  {(q || (type && type !== "ALL")) && (
                    <Link
                      href="/client/statements"
                      className="inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      Clear
                    </Link>
                  )}
                </form>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Receipt className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                        <p className="font-medium text-muted-foreground">No receipts match your search.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(p.paidAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="kpi-number px-4 py-3 font-semibold">{p.reference}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${
                            p.type === "DEPOSIT"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : p.type === "INSTALLMENT"
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {typeLabel[p.type] ?? p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{methodLabel[p.method] ?? p.method}</td>
                        <td className="kpi-number px-4 py-3 font-semibold">{money(parseFloat(p.amount))}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status="Approved" />
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/api/client/receipt/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                          >
                            <Download className="size-3.5" />
                            PDF
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
