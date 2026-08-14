import { SectionTitle, StatCard } from "@/components/ui";
import { RevenueChart, PaymentMethodChart } from "@/components/charts";
import { getExecutiveStats, getMonthlyRevenue } from "@/lib/db/queries/admin";
import { getAllPayments } from "@/lib/db/queries/payments";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { getAllSales } from "@/lib/db/queries/sales";
import { money, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CeoRevenuePage() {
  const [stats, monthly, payments, devs, sales] = await Promise.all([
    getExecutiveStats(),
    getMonthlyRevenue(),
    getAllPayments(),
    getAllDevelopmentsWithStandCounts(),
    getAllSales(),
  ]);

  const chartData = monthly.map((r) => ({
    month: r.month,
    revenue: parseFloat(r.revenue),
    collections: parseFloat(r.collections),
  }));

  const verified = payments.filter((p) => p.status === "VERIFIED");
  const totalCollected = verified.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const methodMap = new Map<string, number>();
  for (const p of verified) {
    const key = p.method.replace(/_/g, " ");
    methodMap.set(key, (methodMap.get(key) ?? 0) + parseFloat(p.amount));
  }
  const methodData = Array.from(methodMap.entries()).map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount);

  const devBreakdown = devs.map((dev) => {
    const devSales = sales.filter((s) => s.developmentId === dev.id);
    const devPayments = verified.filter((p) => p.sale?.developmentId === dev.id || p.reservation?.developmentId === dev.id);
    const revenue = devSales.reduce((sum, s) => sum + parseFloat(s.purchasePrice), 0);
    const collected = devPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const outstanding = devSales.reduce((sum, s) => sum + parseFloat(s.outstandingBalance), 0);
    return { name: dev.name, revenue, collected, outstanding, sold: dev.stands.filter((s) => s.status === "SOLD").length };
  });

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="CEO: Revenue" title="Revenue, collections, and financial performance" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={money(stats.revenue)} />
        <StatCard label="Total Collected" value={money(totalCollected)} />
        <StatCard label="Outstanding" value={money(stats.outstanding)} />
        <StatCard label="Collection Rate" value={percent(stats.revenue > 0 ? totalCollected / stats.revenue : 0)} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Monthly Revenue vs Collections</h2>
        <RevenueChart data={chartData.length > 0 ? chartData : undefined} />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="premium-panel p-5">
          <h2 className="mb-5 text-xl font-semibold">By Payment Method</h2>
          {methodData.length > 0 ? <PaymentMethodChart data={methodData} /> : <p className="text-sm text-muted-foreground">No verified payments yet.</p>}
        </section>
        <section className="premium-panel p-5">
          <h2 className="mb-5 text-xl font-semibold">Revenue by Development</h2>
          <div className="space-y-3">
            {devBreakdown.map((row) => (
              <div key={row.name} className="border-b pb-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{row.name}</span>
                  <span className="kpi-number font-semibold">{money(row.revenue)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                  <span>Collected: {money(row.collected)}</span>
                  <span className="text-red-600">Outstanding: {money(row.outstanding)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
