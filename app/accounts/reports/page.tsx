import { SectionTitle, StatCard } from "@/components/ui";
import { RevenueChart, PaymentMethodChart } from "@/components/charts";
import { getAllPayments } from "@/lib/db/queries/payments";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { getAllSales } from "@/lib/db/queries/sales";
import { money, percent } from "@/lib/utils";

export default async function AccountsReportsPage() {
  const [payments, developments, sales] = await Promise.all([
    getAllPayments(),
    getAllDevelopmentsWithStandCounts(),
    getAllSales(),
  ]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const verified = payments.filter((p) => p.status === "VERIFIED");
  const totalCollected = verified.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.purchasePrice), 0);
  const totalOutstanding = sales.reduce((sum, s) => sum + parseFloat(s.outstandingBalance), 0);
  const collectionRate = totalRevenue > 0 ? totalCollected / totalRevenue : 0;

  // ── Monthly revenue from payments (grouped) ────────────────────────────────
  const monthMap = new Map<string, { month: string; revenue: number; collections: number }>();
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const sale of sales) {
    const m = MONTHS[new Date(sale.createdAt).getMonth()];
    const row = monthMap.get(m) ?? { month: m, revenue: 0, collections: 0 };
    row.revenue += parseFloat(sale.purchasePrice);
    monthMap.set(m, row);
  }
  for (const p of verified) {
    const m = MONTHS[new Date(p.paidAt).getMonth()];
    const row = monthMap.get(m) ?? { month: m, revenue: 0, collections: 0 };
    row.collections += parseFloat(p.amount);
    monthMap.set(m, row);
  }
  const monthlyData = MONTHS.filter((m) => monthMap.has(m)).map((m) => monthMap.get(m)!);

  // ── By-development breakdown ───────────────────────────────────────────────
  const devBreakdown = developments.map((dev) => {
    const devSales = sales.filter((s) => s.developmentId === dev.id);
    const devPayments = verified.filter((p) => {
      return (
        p.sale?.developmentId === dev.id ||
        p.reservation?.developmentId === dev.id
      );
    });
    const revenue = devSales.reduce((sum, s) => sum + parseFloat(s.purchasePrice), 0);
    const collected = devPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const outstanding = devSales.reduce((sum, s) => sum + parseFloat(s.outstandingBalance), 0);
    return {
      name: dev.name,
      totalStands: dev.stands.length,
      sold: dev.stands.filter((s) => s.status === "SOLD").length,
      presale: dev.stands.filter((s) => s.status === "PRESALE").length,
      revenue,
      collected,
      outstanding,
    };
  });

  // ── Payment method breakdown ───────────────────────────────────────────────
  const methodMap = new Map<string, number>();
  for (const p of verified) {
    const key = p.method.replace(/_/g, " ");
    methodMap.set(key, (methodMap.get(key) ?? 0) + parseFloat(p.amount));
  }
  const methodData = Array.from(methodMap.entries())
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Accounts: Revenue Reports"
        title="Collections, outstanding balances, and trends"
      />

      {/* Top KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={money(totalRevenue)} />
        <StatCard label="Total Collected" value={money(totalCollected)} />
        <StatCard label="Outstanding Balance" value={money(totalOutstanding)} />
        <StatCard label="Collection Efficiency" value={percent(collectionRate)} detail={`${verified.length} verified payments`} />
      </div>

      {/* Monthly chart */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Monthly Revenue vs Collections</h2>
        <RevenueChart data={monthlyData.length > 0 ? monthlyData : undefined} />
        <p className="mt-2 text-xs text-muted-foreground">Green = contract revenue booked. Amber = cash collected.</p>
      </section>

      {/* By-development breakdown */}
      <section className="premium-panel mt-10">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Revenue by Development</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Stands</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Presale</th>
                <th className="px-4 py-3">Contract Revenue</th>
                <th className="px-4 py-3">Cash Collected</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Collection %</th>
              </tr>
            </thead>
            <tbody>
              {devBreakdown.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="kpi-number px-4 py-3">{row.totalStands}</td>
                  <td className="kpi-number px-4 py-3 text-emerald-700 font-semibold">{row.sold}</td>
                  <td className="kpi-number px-4 py-3 text-amber-700 font-semibold">{row.presale}</td>
                  <td className="kpi-number px-4 py-3">{money(row.revenue)}</td>
                  <td className="kpi-number px-4 py-3 font-semibold text-emerald-700">{money(row.collected)}</td>
                  <td className="kpi-number px-4 py-3 text-red-700">{money(row.outstanding)}</td>
                  <td className="kpi-number px-4 py-3">
                    {row.revenue > 0 ? percent(row.collected / row.revenue) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment method breakdown */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="premium-panel p-5">
          <h2 className="mb-5 text-xl font-semibold">Collections by Payment Method</h2>
          {methodData.length > 0 ? (
            <PaymentMethodChart data={methodData} />
          ) : (
            <p className="text-sm text-muted-foreground">No verified payments yet.</p>
          )}
        </div>
        <div className="premium-panel p-5">
          <h2 className="mb-5 text-xl font-semibold">Method Summary</h2>
          <div className="space-y-3">
            {methodData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              methodData.map((row) => (
                <div key={row.method} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <span className="font-medium">{row.method}</span>
                  <div className="text-right">
                    <span className="kpi-number font-semibold">{money(row.amount)}</span>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {totalCollected > 0 ? percent(row.amount / totalCollected) : "—"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
