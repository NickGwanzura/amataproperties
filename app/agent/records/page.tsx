import { Download } from "lucide-react";
import { SectionTitle, StatusBadge } from "@/components/ui";
import { getAllSales, getSalesByAgent } from "@/lib/db/queries/sales";
import { getCurrentAgentProfile } from "@/lib/agent";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentRecordsPage() {
  const agent = await getCurrentAgentProfile();
  const sales = agent ? await getSalesByAgent(agent.id) : await getAllSales();

  const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.purchasePrice), 0);
  const totalOutstanding = sales.reduce((sum, s) => sum + parseFloat(s.outstandingBalance), 0);

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Agent: Presale Records" title="Completed sales and allocations" />

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total Sales</p>
          <p className="kpi-number mt-2 text-3xl font-semibold">{sales.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Active</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-amber-700">{sales.filter((s) => s.status === "ACTIVE").length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total Revenue</p>
          <p className="kpi-number mt-2 text-3xl font-semibold">{money(totalRevenue)}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Outstanding</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-red-700">{money(totalOutstanding)}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <a
          href="/api/reports/sales/csv"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Download CSV
        </a>
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">Sales Register</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{sales.length} total transactions</p>
        </div>

        {sales.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="divide-y sm:hidden">
              {sales.map((s) => (
                <div key={s.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="kpi-number text-sm font-semibold">{s.saleNumber}</p>
                      <p className="text-sm font-medium">{s.client.name}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.development.name} &middot; Stand {s.stand.standNumber}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="kpi-number font-semibold">{money(parseFloat(s.purchasePrice))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposit Paid</p>
                      <p className="kpi-number font-semibold text-emerald-700">{money(parseFloat(s.depositPaid))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Outstanding</p>
                      <p className="kpi-number font-semibold text-red-700">{money(parseFloat(s.outstandingBalance))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Agent</p>
                      <p className="font-medium">{"agent" in s && s.agent ? (s.agent as { user?: { name?: string } })?.user?.name : "—"}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/client/statement/${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:translate-y-px"
                  >
                    <Download className="size-3.5" />
                    Download Statement
                  </a>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Sale #</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Development</th>
                    <th className="px-4 py-3">Stand</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Deposit Paid</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Statement</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="kpi-number px-4 py-3 font-semibold">{s.saleNumber}</td>
                      <td className="px-4 py-3">{s.client.name}</td>
                      <td className="px-4 py-3">{s.development.name}</td>
                      <td className="kpi-number px-4 py-3 font-semibold">{s.stand.standNumber}</td>
                      <td className="kpi-number px-4 py-3">{money(parseFloat(s.purchasePrice))}</td>
                      <td className="kpi-number px-4 py-3 text-emerald-700 font-semibold">{money(parseFloat(s.depositPaid))}</td>
                      <td className="kpi-number px-4 py-3 text-red-700">{money(parseFloat(s.outstandingBalance))}</td>
                      <td className="px-4 py-3 text-muted-foreground">{"agent" in s && s.agent ? (s.agent as { user?: { name?: string } })?.user?.name : "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/client/statement/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
                        >
                          <Download className="size-3.5" />
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
