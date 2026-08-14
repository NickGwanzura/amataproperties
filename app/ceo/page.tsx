import Link from "next/link";
import { SectionTitle, StatCard } from "@/components/ui";
import { RevenueChart } from "@/components/charts";
import { getExecutiveStats, getAgentRankings, getAgingReport, getMonthlyRevenue } from "@/lib/db/queries/admin";
import { money, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CeoPage() {
  const [stats, rankings, aging, monthly] = await Promise.all([
    getExecutiveStats(),
    getAgentRankings(),
    getAgingReport(),
    getMonthlyRevenue(),
  ]);

  const chartData = monthly.map((r) => ({
    month: r.month,
    revenue: parseFloat(r.revenue),
    collections: parseFloat(r.collections),
  }));

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="CEO Dashboard" title="Executive visibility across sales, revenue, and collections" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Developments" value={String(stats.developments)} />
        <StatCard label="Total Stands" value={String(stats.totalStands)} />
        <StatCard label="Available" value={String(stats.available)} />
        <StatCard label="Sold" value={String(stats.sold)} />
        <StatCard label="Total Revenue" value={money(stats.revenue)} />
        <StatCard label="Outstanding" value={money(stats.outstanding)} />
        <StatCard label="Collection Efficiency" value={percent(stats.collectionEfficiency)} />
        <StatCard label="Commission Liability" value={money(stats.commissionLiability)} />
      </div>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Revenue vs Collections</h2>
            <Link href="/ceo/revenue" className="text-sm font-semibold text-primary">Full report →</Link>
          </div>
          <RevenueChart data={chartData.length > 0 ? chartData : undefined} />
        </div>
        <div className="premium-panel">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-semibold">Aging Report</h2>
            <Link href="/ceo/aging" className="text-sm font-semibold text-primary">Details →</Link>
          </div>
          {aging.map((item) => (
            <div key={item.bucket} className="flex items-center justify-between border-b p-4 last:border-b-0">
              <span className="text-sm font-medium">{item.bucket}</span>
              <span className="kpi-number font-semibold">{money(item.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-panel mt-10">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-semibold">Agent Rankings</h2>
          <div className="flex items-center gap-3">
            <Link href="/ceo/agents" className="text-sm font-semibold text-primary">Full table →</Link>
            <Link href="/api/reports/agents/csv" className="text-sm font-semibold text-primary">Download CSV</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Commission</th>
              </tr>
            </thead>
            <tbody>
              {rankings.filter(Boolean).slice(0, 5).map((agent, i) => (
                <tr key={agent!.name} className="border-t hover:bg-muted/30">
                  <td className="kpi-number px-4 py-3 text-muted-foreground font-semibold">#{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">{agent!.name}</td>
                  <td className="kpi-number px-4 py-3">{agent!.sales}</td>
                  <td className="kpi-number px-4 py-3 font-semibold">{money(agent!.revenue)}</td>
                  <td className="kpi-number px-4 py-3">{money(agent!.commission)}</td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No sales data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
