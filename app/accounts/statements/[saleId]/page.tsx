export const dynamic = "force-dynamic";

import { ArrowLeft, Download, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { getSaleById } from "@/lib/db/queries/sales";
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
export default async function AccountsSaleReceiptsPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  const sale = await getSaleById(saleId);
  if (!sale) notFound();

  const verifiedPayments = sale.payments.filter((p) => p.status === "VERIFIED");
  const finance = getSaleFinancialSnapshot(sale);
  const purchasePrice = finance.purchasePrice;
  const outstandingBalance = finance.outstanding;
  const adminFees = finance.adminFees;
  const totalPaid = finance.propertyPaid;
  const progress = purchasePrice > 0 ? Math.min(100, (finance.propertyPaid / purchasePrice) * 100) : 0;
  const isLedgerAdjusted = finance.isReconciledFromLedger;

  return (
    <div className="dashboard-page">
      {/* Back nav */}
      <Link
        href="/accounts/statements"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Statements
      </Link>

      {/* Sale header */}
      <section className="premium-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account Statement
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{sale.client?.name ?? "—"}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {sale.client?.email} · {sale.client?.nationalId}
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold">{sale.saleNumber}</span> ·{" "}
              {sale.development?.name} · Stand {sale.stand?.standNumber}
            </p>
          </div>
          <a
            href={`/api/client/statement/${sale.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
          >
            <FileText className="size-4" />
            Full Statement PDF
          </a>
        </div>

        {/* KPI row */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Purchase Price
            </p>
            <p className="kpi-number mt-0.5 font-semibold">
              {money(parseFloat(sale.purchasePrice))}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Paid
            </p>
            <p className="kpi-number mt-0.5 font-semibold text-emerald-700">
              {money(totalPaid)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Outstanding
            </p>
            <p className="kpi-number mt-0.5 font-semibold text-amber-700">
              {money(outstandingBalance)}
            </p>
          </div>
          {adminFees > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Admin Fees
              </p>
              <p className="kpi-number mt-0.5 font-semibold text-amber-700">
                {money(adminFees)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Progress
              </p>
              <p className="mt-0.5 font-semibold">{progress.toFixed(1)}%</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {isLedgerAdjusted && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Displayed totals are reconciled from verified payments because the stored sale balance is stale.
          </div>
        )}
      </section>

      {/* Receipts table */}
      <section className="premium-panel mt-6">
        <div className="border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Receipt className="size-5 text-primary" />
            Payment Receipts
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {verifiedPayments.length} verified payment
            {verifiedPayments.length !== 1 ? "s" : ""}
            {sale.payments.length !== verifiedPayments.length
              ? ` (${sale.payments.length - verifiedPayments.length} pending/unverified)`
              : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
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
              {sale.payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Receipt className="mx-auto mb-3 size-8 text-muted-foreground/30" />
                    <p className="font-medium text-muted-foreground">No payments recorded yet.</p>
                  </td>
                </tr>
              ) : (
                sale.payments.map((p) => (
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
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${
                          p.type === "DEPOSIT"
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                            : p.type === "INSTALLMENT"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {typeLabel[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {methodLabel[p.method] ?? p.method}
                    </td>
                    <td className="kpi-number px-4 py-3 font-semibold">
                      {money(parseFloat(p.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={
                          p.status === "VERIFIED"
                            ? "Approved"
                            : p.status === "PENDING"
                              ? "Pending"
                              : "Rejected"
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "VERIFIED" ? (
                        <a
                          href={`/api/client/receipt/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                        >
                          <Download className="size-3.5" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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
