import { SectionTitle, StatCard } from "@/components/ui";
import { InstallmentTrendChart } from "@/components/charts";
import { money, percent } from "@/lib/utils";
import {
  getCollectedInstallmentRevenue,
  getExpectedInstallmentRevenue,
  getInstallmentRevenueSummary,
} from "@/lib/db/queries/revenue";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { emailInstallmentRevenueReport } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountsRevenuePage() {
  const [summary, collected, expected, developments] = await Promise.all([
    getInstallmentRevenueSummary(),
    getCollectedInstallmentRevenue(),
    getExpectedInstallmentRevenue(),
    getAllDevelopmentsWithStandCounts(),
  ]);

  // ── Build month column headers (sorted, deduped) ──────────────────────────
  const monthSet = new Set<string>();
  for (const r of collected) monthSet.add(r.monthKey);
  for (const r of expected) monthSet.add(r.monthKey);
  const months = Array.from(monthSet).sort((a, b) => {
    // Parse "Mon YYYY" for chronological sort
    const da = new Date(a + " 01");
    const db = new Date(b + " 01");
    return da.getTime() - db.getTime();
  });

  // ── Build collected map: devId × monthKey → amount ────────────────────────
  const collectedMap = new Map<string, number>();
  for (const r of collected) {
    collectedMap.set(`${r.developmentId}::${r.monthKey}`, r.collected);
  }

  // ── Build expected map: devId × monthKey → amount ─────────────────────────
  const expectedMap = new Map<string, number>();
  for (const r of expected) {
    expectedMap.set(`${r.developmentId}::${r.monthKey}`, r.expected);
  }

  // ── Development rows with per-month totals + row total ─────────────────────
  const devRows = developments.map((dev) => {
    const monthlyCollected = months.map((m) => collectedMap.get(`${dev.id}::${m}`) ?? 0);
    const rowTotal = monthlyCollected.reduce((s, v) => s + v, 0);
    return { name: dev.name, id: dev.id, monthlyCollected, rowTotal };
  });

  // ── Column totals ─────────────────────────────────────────────────────────
  const colTotals = months.map((_, mi) =>
    devRows.reduce((s, row) => s + row.monthlyCollected[mi], 0),
  );
  const grandTotal = colTotals.reduce((s, v) => s + v, 0);

  // ── Prepare expected vs collected by development for the summary section ──
  const devExpectedMap = new Map<string, { expected: number; paid: number }>();
  for (const r of expected) {
    const prev = devExpectedMap.get(r.developmentId) ?? { expected: 0, paid: 0 };
    prev.expected += r.expected;
    prev.paid += r.paid;
    devExpectedMap.set(r.developmentId, prev);
  }

  // ── Build chart data for stacked bar chart ───────────────────────────────
  const activeDevRows = devRows.filter((r) => r.rowTotal > 0);
  const chartData = months.map((month, mi) => {
    const point: Record<string, number | string> = { month };
    for (const row of activeDevRows) {
      point[row.name] = row.monthlyCollected[mi];
    }
    return point;
  });

  const devCollectionRates = developments
    .map((dev) => {
      const d = devExpectedMap.get(dev.id);
      return {
        name: dev.name,
        expected: d?.expected ?? 0,
        paid: d?.paid ?? 0,
        collected: devRows.find((r) => r.id === dev.id)?.rowTotal ?? 0,
      };
    })
    .filter((d) => d.expected > 0 || d.collected > 0);

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Accounts: Installment Revenue"
        title="Per-month revenue tracking by development with export"
      />

      {/* ── KPIs ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Installment Revenue Collected" value={money(summary.totalCollected)} />
        <StatCard label="Expected Installment Revenue" value={money(summary.totalExpected)} />
        <StatCard
          label="Collection Rate"
          value={percent(summary.collectionRate)}
          detail={`${summary.overdueInstallments} overdue`}
        />
        <StatCard label="Active Installment Plans" value={String(summary.activePlans)} />
      </div>

      {/* ── Export & Email Buttons ── */}
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/api/reports/installment-revenue/csv"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
          </svg>
          Download CSV
        </a>
        <a
          href="/api/reports/installment-revenue/xlsx"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
          </svg>
          Download Excel
        </a>
        <a
          href="/api/reports/installment-revenue/pdf"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 0 0 2-2V9.414a1 1 0 0 0-.293-.707l-5.414-5.414A1 1 0 0 0 12.586 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
          </svg>
          Download PDF
        </a>
        <form
          action={emailInstallmentRevenueReport}
          className="inline-flex"
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
            </svg>
            Email Report
          </button>
        </form>
      </div>

      {/* ── Installment Trend Chart ── */}
      {chartData.length > 0 && (
        <section className="mt-8">
          <InstallmentTrendChart data={chartData as unknown as import("@/components/charts").InstallmentTrendRow[]} />
        </section>
      )}

      {/* ── Monthly Matrix ── */}
      <section className="premium-panel mt-8">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Monthly Installment Revenue by Development</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified installment payments collected per month. Cells show collected amount.
          </p>
        </div>
        {months.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No installment payment data yet. Revenue will appear here once installments start being collected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-left">Development</th>
                  {months.map((m) => (
                    <th key={m} className="px-4 py-3 text-right">
                      {m}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-primary">Total</th>
                </tr>
              </thead>
              <tbody>
                {devRows
                  .filter((r) => r.rowTotal > 0)
                  .map((row) => (
                    <tr key={row.id} className="border-t transition hover:bg-muted/50">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium hover:bg-muted/50">
                        {row.name}
                      </td>
                      {row.monthlyCollected.map((amount, mi) => (
                        <td
                          key={`${row.id}-${months[mi]}`}
                          className="kpi-number px-4 py-3 text-right"
                        >
                          {amount > 0 ? money(amount) : "—"}
                        </td>
                      ))}
                      <td className="kpi-number px-4 py-3 text-right font-semibold text-primary">
                        {money(row.rowTotal)}
                      </td>
                    </tr>
                  ))}
                {/* Grand total row */}
                <tr className="border-t-2 border-primary/20 font-semibold">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 text-xs uppercase text-muted-foreground">
                    Total
                  </td>
                  {colTotals.map((total, mi) => (
                    <td key={`total-${months[mi]}`} className="kpi-number px-4 py-3 text-right text-primary">
                      {total > 0 ? money(total) : "—"}
                    </td>
                  ))}
                  <td className="kpi-number px-4 py-3 text-right text-lg font-semibold text-primary">
                    {money(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Expected vs Collected by Development ── */}
      {devCollectionRates.length > 0 && (
        <section className="premium-panel mt-8">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">Expected vs Collected by Development</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Total expected installment revenue vs actual collections per development.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3 text-right">Expected</th>
                  <th className="px-4 py-3 text-right">Collected</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-right">Collection %</th>
                </tr>
              </thead>
              <tbody>
                {devCollectionRates.map((row) => {
                  const outstanding = row.expected - row.collected;
                  const rate = row.expected > 0 ? row.collected / row.expected : 0;
                  return (
                    <tr key={row.name} className="border-t transition hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="kpi-number px-4 py-3 text-right">{money(row.expected)}</td>
                      <td className="kpi-number px-4 py-3 text-right font-semibold text-emerald-700">
                        {money(row.collected)}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right text-red-600">
                        {money(outstanding)}
                      </td>
                      <td className="kpi-number px-4 py-3 text-right">{percent(rate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Back link ── */}
      <div className="mt-8">
        <Link href="/accounts/reports" className="text-sm font-semibold text-primary hover:underline">
          ← Back to Revenue Reports
        </Link>
      </div>
    </div>
  );
}
