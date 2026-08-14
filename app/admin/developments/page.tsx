import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { SectionTitle, StatusBadge } from "@/components/ui";
import { getAllDevelopmentsAdmin, getDevelopmentKpis } from "@/lib/db/queries/developments";
import { toggleDevelopmentActive } from "@/lib/actions";
import { money, percent } from "@/lib/utils";
import { DevArchiveButton, DevDeleteButton, DevDuplicateButton, DevRestoreButton } from "./_dev-actions";

export const dynamic = "force-dynamic";

export default async function AdminDevelopmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showArchived = view === "archived" || view === "all";
  const showDeleted = view === "deleted" || view === "all";

  const devs = await getAllDevelopmentsAdmin({ includeArchived: showArchived, includeDeleted: showDeleted });
  const kpis = await Promise.all(devs.map((d) => getDevelopmentKpis(d.id)));

  return (
    <div className="dashboard-page">
      <div className="flex items-end justify-between">
        <SectionTitle eyebrow="Admin: Developments" title="Estate inventory and onboarding" />
        <Link
          href="/admin/developments/new"
          className="inline-flex h-11 items-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5"
        >
          <Plus className="size-4" /> New Development
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Developments</p>
          <p className="mt-2 text-3xl font-semibold kpi-number">{devs.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Stands</p>
          <p className="mt-2 text-3xl font-semibold kpi-number">{devs.reduce((sum, d) => sum + d.stands.length, 0)}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Available Stands</p>
          <p className="mt-2 text-3xl font-semibold kpi-number text-emerald-700">
            {devs.reduce((sum, d) => sum + d.stands.filter((s) => s.status === "AVAILABLE").length, 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
        {[
          { key: "", label: "Active" },
          { key: "archived", label: "+ Archived" },
          { key: "deleted", label: "+ Deleted" },
          { key: "all", label: "All" },
        ].map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/developments?view=${f.key}` : "/admin/developments"}
            className={`rounded-full border px-3 py-1.5 transition ${
              (view ?? "") === f.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <section className="premium-panel mt-6">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">All Developments</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{devs.length} estates</p>
        </div>
        <div className="divide-y">
          {devs.map((dev, i) => {
            const kpi = kpis[i];
            const available = dev.stands.filter((s) => s.status === "AVAILABLE").length;
            const presale = dev.stands.filter((s) => s.status === "PRESALE").length;
            const reserved = dev.stands.filter((s) => s.status === "RESERVED").length;
            const sold = dev.stands.filter((s) => s.status === "SOLD").length;
            return (
              <div key={dev.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{dev.name}</p>
                      {dev.deletedAt ? (
                        <StatusBadge status="Deleted" className="border-red-200 bg-red-50 text-red-800" />
                      ) : dev.archivedAt ? (
                        <StatusBadge status="Archived" className="border-amber-200 bg-amber-50 text-amber-800" />
                      ) : (
                        <StatusBadge status={dev.active ? "Active" : "Inactive"} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{dev.location}, {dev.province}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/developments/${dev.slug}`} className="text-sm font-semibold text-primary">View</Link>
                    <Link href={`/sysadmin/developments/${dev.slug}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Edit</Link>
                    <Link href={`/admin/stands?dev=${dev.id}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Stands</Link>
                    {dev.deletedAt ? (
                      <DevRestoreButton id={dev.id} />
                    ) : (
                      <>
                        <form action={toggleDevelopmentActive.bind(null, dev.id, !dev.active)}>
                          <button type="submit" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                            {dev.active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                        <DevArchiveButton id={dev.id} archived={Boolean(dev.archivedAt)} />
                        <DevDuplicateButton id={dev.id} />
                        {sold === 0 && reserved === 0 && <DevDeleteButton id={dev.id} />}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Value</p>
                    <p className="kpi-number mt-0.5 font-semibold">{money(kpi.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Occupancy</p>
                    <p className="kpi-number mt-0.5 font-semibold">{percent(kpi.occupancyPct / 100)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sales Progress</p>
                    <p className="kpi-number mt-0.5 font-semibold">{percent(kpi.salesProgressPct / 100)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outstanding</p>
                    <p className="kpi-number mt-0.5 font-semibold text-amber-700">{money(kpi.outstandingInstallments)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reserved Value</p>
                    <p className="kpi-number mt-0.5 font-semibold text-blue-700">{money(kpi.reservedValue)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <Link
                    href={`/admin/stands?dev=${dev.id}&status=AVAILABLE`}
                    aria-label={`View ${available} available stands at ${dev.name}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    {available} available <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <span>{presale} presale</span>
                  <span>{reserved} reserved</span>
                  <span>{sold} sold</span>
                  <span>{dev.stands.length} total</span>
                </div>
              </div>
            );
          })}
          {devs.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No developments match this filter.</div>
          )}
        </div>
      </section>
    </div>
  );
}
