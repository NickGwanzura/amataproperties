import { SectionTitle } from "@/components/ui";
import { getCurrentAgentProfile } from "@/lib/agent";
import { getAllCommissions, getCommissionsByAgent } from "@/lib/db/queries/commissions";
import { StatusBadge } from "@/components/ui";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentCommissionsPage() {
  const agent = await getCurrentAgentProfile();
  const commissions = agent
    ? await getCommissionsByAgent(agent.id)
    : await getAllCommissions();

  const pending = commissions.filter((c) => c.status === "PENDING");
  const approved = commissions.filter((c) => c.status === "APPROVED");
  const paid = commissions.filter((c) => c.status === "PAID");

  const totalPending = pending.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const totalApproved = approved.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const totalPaid = paid.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const totalPossible = totalPending + totalApproved + totalPaid;
  const pct = totalPossible > 0 ? Math.round((totalPaid / totalPossible) * 100) : 0;

  return (
    <div className="dashboard-page">
      <div className="flex items-center justify-between">
        <SectionTitle eyebrow="Agent: Commissions" title="Commission ledger and payment status" />
        <a
          href="/api/reports/agents/csv"
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Download CSV
        </a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Pending Approval</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-amber-700">{money(totalPending)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{pending.length} commissions</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Approved</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-blue-700">{money(totalApproved)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{approved.length} commissions</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Paid Out</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-emerald-700">{money(totalPaid)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{paid.length} commissions</p>
        </div>
      </div>

      <div className="premium-panel mt-6 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Commission Progress</span>
          <span className="text-muted-foreground">
            {money(totalPaid)} / {money(totalPossible)} ({pct}%)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">Commission Ledger</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Commission approvals are processed by the Accounts team</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Sale #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Stand</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No commissions yet.</td></tr>
              ) : (
                commissions.map((comm) => (
                  <tr key={comm.id} className="border-t hover:bg-muted/30">
                    <td className="kpi-number px-4 py-3 font-semibold">{comm.sale.saleNumber}</td>
                    <td className="px-4 py-3">{comm.sale.client.name}</td>
                    <td className="px-4 py-3">{comm.sale.development.name}</td>
                    <td className="kpi-number px-4 py-3">{comm.sale.stand.standNumber}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(parseFloat(comm.amount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={comm.status} /></td>
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
