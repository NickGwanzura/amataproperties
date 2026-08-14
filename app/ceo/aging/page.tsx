import { SectionTitle } from "@/components/ui";
import { getAgingReport } from "@/lib/db/queries/admin";
import { getAllSales } from "@/lib/db/queries/sales";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CeoAgingPage() {
  const [aging, sales] = await Promise.all([getAgingReport(), getAllSales()]);

  const activeSales = sales.filter((s) => s.status === "ACTIVE");
  const totalOutstanding = activeSales.reduce((sum, s) => sum + parseFloat(s.outstandingBalance), 0);
  const totalAging = aging.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="CEO: Aging Report" title="Outstanding balances by age bucket" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Active Sales</p>
          <p className="kpi-number mt-2 text-3xl font-semibold">{activeSales.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total Outstanding</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-red-700">{money(totalOutstanding)}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Overdue (30d+)</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-red-700">
            {money(aging.filter((b) => b.bucket !== "Current").reduce((sum, b) => sum + b.amount, 0))}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="premium-panel">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">Aging Buckets</h2>
          </div>
          {aging.map((bucket, i) => {
            const pct = totalAging > 0 ? bucket.amount / totalAging : 0;
            const colors = ["bg-emerald-500", "bg-amber-400", "bg-orange-500", "bg-red-500", "bg-red-800"];
            return (
              <div key={bucket.bucket} className="border-b p-5 last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{bucket.bucket}</span>
                  <span className="kpi-number font-semibold">{money(bucket.amount)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className={`h-2 rounded-full ${colors[i]}`} style={{ width: `${pct * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{Math.round(pct * 100)}% of total outstanding</p>
              </div>
            );
          })}
        </section>

        <section className="premium-panel">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">Active Sales by Balance</h2>
          </div>
          <div className="overflow-y-auto max-h-[420px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {activeSales
                  .sort((a, b) => parseFloat(b.outstandingBalance) - parseFloat(a.outstandingBalance))
                  .map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{s.client.name}</td>
                      <td className="kpi-number px-4 py-3">{s.stand.standNumber}</td>
                      <td className="kpi-number px-4 py-3 font-semibold text-red-700">{money(parseFloat(s.outstandingBalance))}</td>
                    </tr>
                  ))}
                {activeSales.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No active sales.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
