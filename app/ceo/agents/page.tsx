import { SectionTitle, StatCard } from "@/components/ui";
import { getAgentRankings } from "@/lib/db/queries/admin";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CeoAgentsPage() {
  const rankings = (await getAgentRankings()).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getAgentRankings>>[number]>[];

  const totalRevenue = rankings.reduce((sum, a) => sum + a.revenue, 0);
  const totalCommission = rankings.reduce((sum, a) => sum + a.commission, 0);

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="CEO: Agent Rankings" title="Individual sales performance and commissions" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Agents" value={String(rankings.length)} />
        <StatCard label="Total Sales Revenue" value={money(totalRevenue)} />
        <StatCard label="Total Commission" value={money(totalCommission)} />
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">Agent Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Revenue Share</th>
                <th className="px-4 py-3">Commission</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No agent sales data yet.</td>
                </tr>
              ) : (
                rankings.map((agent, i) => (
                  <tr key={agent.name} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className={`kpi-number inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-slate-100 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-700" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{agent.name}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{agent.sales}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(agent.revenue)}</td>
                    <td className="kpi-number px-4 py-3 text-muted-foreground">
                      {totalRevenue > 0 ? `${Math.round((agent.revenue / totalRevenue) * 100)}%` : "—"}
                    </td>
                    <td className="kpi-number px-4 py-3">{money(agent.commission)}</td>
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
