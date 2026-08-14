import { SectionTitle, StatCard, EmptyState } from "@/components/ui";
import { money, cn } from "@/lib/utils";
import {
  getInstallmentAgingByDevelopment,
  getOverdueInstallmentsDetail,
  getInstallmentAgingSummary,
} from "@/lib/db/queries/revenue";
import Link from "next/link";

export const dynamic = "force-dynamic";

function daysColor(days: number) {
  if (days <= 30) return "text-amber-600 bg-amber-50";
  if (days <= 60) return "text-orange-600 bg-orange-50";
  if (days <= 90) return "text-red-600 bg-red-50";
  return "text-red-800 bg-red-100";
}

export default async function InstallmentAgingPage() {
  const [summary, aging, overdueDetail] = await Promise.all([
    getInstallmentAgingSummary(),
    getInstallmentAgingByDevelopment(),
    getOverdueInstallmentsDetail(),
  ]);

  const totalOverdueAll = aging.reduce((s, r) => s + r.totalOverdue, 0);

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Accounts: Installment Aging"
        title="Overdue installments by development with aging analysis"
      />

      {/* ── KPIs ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Overdue"
          value={money(summary.totalOverdue)}
          detail={`${summary.overdueCount} overdue installments`}
        />
        <StatCard label="At-Risk Clients" value={String(summary.atRiskClients)} />
        <StatCard
          label="Affected Developments"
          value={String(summary.affectedDevelopments)}
          detail={summary.affectedDevelopments === 1 ? "1 development" : `${summary.affectedDevelopments} developments`}
        />
        <StatCard
          label="Avg Overdue per Client"
          value={summary.atRiskClients > 0 ? money(summary.totalOverdue / summary.atRiskClients) : "$0"}
        />
      </div>

      {/* ── Export buttons ── */}
      {overdueDetail.length > 0 && (
        <div className="mt-6 flex gap-3">
          <a
            href="/api/reports/installment-aging/csv"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            Download CSV
          </a>
          <a
            href="/api/reports/installment-aging/xlsx"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            Download Excel
          </a>
        </div>
      )}

      {/* ── Aging Summary by Development ── */}
      <section className="premium-panel mt-8">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Aging Summary by Development</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Overdue installment amounts grouped by aging bucket per development.
          </p>
        </div>
        {aging.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No overdue installments"
              detail="All installment payments are up to date. No aging data to display."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3 text-right">0–30 Days</th>
                  <th className="px-4 py-3 text-right">31–60 Days</th>
                  <th className="px-4 py-3 text-right">61–90 Days</th>
                  <th className="px-4 py-3 text-right">90+ Days</th>
                  <th className="px-4 py-3 text-right">Total Overdue</th>
                  <th className="px-4 py-3 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {aging.map((row) => {
                  return (
                    <tr key={row.developmentId} className="border-t transition hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{row.developmentName}</td>
                      <td className="kpi-number px-4 py-3 text-right">
                        {row.bucket0_30 > 0 ? (
                          <span className="text-amber-700">{money(row.bucket0_30)}</span>
                        ) : "—"}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right">
                        {row.bucket31_60 > 0 ? (
                          <span className="text-orange-700">{money(row.bucket31_60)}</span>
                        ) : "—"}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right">
                        {row.bucket61_90 > 0 ? (
                          <span className="text-red-700">{money(row.bucket61_90)}</span>
                        ) : "—"}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right">
                        {row.bucket90plus > 0 ? (
                          <span className="font-semibold text-red-800">{money(row.bucket90plus)}</span>
                        ) : "—"}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right font-semibold text-red-700">
                        {money(row.totalOverdue)}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right">{row.overdueCount}</td>
                    </tr>
                  );
                })}
                {/* Grand total row */}
                <tr className="border-t-2 border-red-200 font-semibold">
                  <td className="px-4 py-3 text-xs uppercase text-muted-foreground">Total</td>
                  <td className="kpi-number px-4 py-3 text-right text-amber-700">
                    {money(aging.reduce((s, r) => s + r.bucket0_30, 0))}
                  </td>
                  <td className="kpi-number px-4 py-3 text-right text-orange-700">
                    {money(aging.reduce((s, r) => s + r.bucket31_60, 0))}
                  </td>
                  <td className="kpi-number px-4 py-3 text-right text-red-700">
                    {money(aging.reduce((s, r) => s + r.bucket61_90, 0))}
                  </td>
                  <td className="kpi-number px-4 py-3 text-right text-red-800">
                    {money(aging.reduce((s, r) => s + r.bucket90plus, 0))}
                  </td>
                  <td className="kpi-number px-4 py-3 text-right font-semibold text-red-700">
                    {money(totalOverdueAll)}
                  </td>
                  <td className="kpi-number px-4 py-3 text-right">
                    {aging.reduce((s, r) => s + r.overdueCount, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Aging Distribution Bars ── */}
      {aging.length > 0 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {aging.map((row) => {
            const maxVal = Math.max(row.bucket0_30, row.bucket31_60, row.bucket61_90, row.bucket90plus, 1);
            const total = row.totalOverdue;
            return (
              <div key={row.developmentId} className="premium-panel p-5">
                <h3 className="mb-3 text-sm font-semibold">{row.developmentName}</h3>
                <p className="mb-3 text-2xl font-semibold text-red-700">{money(total)}</p>
                <div className="space-y-2">
                  {[
                    { label: "0–30 Days", amount: row.bucket0_30, color: "bg-amber-400", pct: row.bucket0_30 / maxVal },
                    { label: "31–60 Days", amount: row.bucket31_60, color: "bg-orange-500", pct: row.bucket31_60 / maxVal },
                    { label: "61–90 Days", amount: row.bucket61_90, color: "bg-red-500", pct: row.bucket61_90 / maxVal },
                    { label: "90+ Days", amount: row.bucket90plus, color: "bg-red-800", pct: row.bucket90plus / maxVal },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">{b.label}</span>
                        <span className="font-semibold">{money(b.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${b.color}`}
                          style={{ width: `${Math.min(b.pct * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Overdue Installments Detail ── */}
      <section className="premium-panel mt-8">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Overdue Installments Detail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All unpaid installments past due, sorted by development and due date.
          </p>
        </div>
        {overdueDetail.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No overdue installments"
              detail="All installment payments are current."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3 text-right">Amount Due</th>
                  <th className="px-4 py-3 text-right">Due Date</th>
                  <th className="px-4 py-3 text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {overdueDetail.map((row) => (
                  <tr key={row.installmentId} className="border-t transition hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      {row.clientName}
                      <span className="ml-2 text-xs text-muted-foreground">{row.clientPhone}</span>
                    </td>
                    <td className="px-4 py-3">{row.developmentName}</td>
                    <td className="kpi-number px-4 py-3">{row.standNumber}</td>
                    <td className="kpi-number px-4 py-3 text-right font-semibold text-red-700">
                      {money(row.amountDue)}
                    </td>
                    <td className="kpi-number px-4 py-3 text-right">
                      {row.dueDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          daysColor(row.daysOverdue),
                        )}
                      >
                        {row.daysOverdue}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Back link ── */}
      <div className="mt-8">
        <Link href="/accounts/revenue" className="text-sm font-semibold text-primary hover:underline">
          ← Back to Installment Revenue
        </Link>
      </div>
    </div>
  );
}
