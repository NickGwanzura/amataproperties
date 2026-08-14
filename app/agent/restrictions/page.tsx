import { CircleSlash } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentRestrictionsPage() {
  const devs = await getAllDevelopmentsWithStandCounts();
  const blockedStands = devs.flatMap((d) =>
    d.stands
      .filter((s) => s.status === "BLOCKED")
      .map((s) => ({ ...s, developmentName: d.name }))
  );

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Agent: Restrictions" title="Blocked and restricted stands" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total Blocked</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-muted-foreground">{blockedStands.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Across Developments</p>
          <p className="kpi-number mt-2 text-3xl font-semibold">{devs.filter((d) => d.stands.some((s) => s.status === "BLOCKED")).length}</p>
        </div>
      </div>

      {blockedStands.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <CircleSlash className="size-10 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No blocked stands</p>
          <p className="text-sm text-muted-foreground">All stands are currently available for allocation.</p>
        </div>
      ) : (
        <section className="premium-panel mt-8">
          <div className="border-b px-5 py-4">
            <h2 className="text-xl font-semibold">Blocked Stands</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{blockedStands.length} stands restricted from allocation. Contact your admin to unblock.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Stand #</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {blockedStands.map((stand) => (
                  <tr key={stand.id} className="border-t hover:bg-muted/30">
                    <td className="kpi-number px-4 py-3 font-semibold">{stand.standNumber}</td>
                    <td className="px-4 py-3">{stand.developmentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{stand.phase}</td>
                    <td className="kpi-number px-4 py-3">{stand.sizeSqm} sqm</td>
                    <td className="kpi-number px-4 py-3">{money(parseFloat(stand.price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
