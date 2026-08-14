import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { getAllDevelopmentsWithStandCounts, toggleDevelopmentActive } from "@/lib/db/queries/developments";
import { Building2, MapPin } from "lucide-react";
import { revalidatePath } from "next/cache";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function toggle(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  await toggleDevelopmentActive(id, !active);
  revalidatePath("/sysadmin/developments");
}

export default async function SysadminDevelopmentsPage() {
  const devs = await getAllDevelopmentsWithStandCounts();

  return (
    <main className="dashboard-page">
      <div className="flex items-start justify-between">
        <SectionTitle eyebrow="Developments" title="All developments on the platform" />
        <Link
          href="/sysadmin/developments/new"
          className="mt-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          + New Development
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="kpi-number mt-1 text-3xl font-semibold">{devs.length}</p>
        </div>
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="kpi-number mt-1 text-3xl font-semibold text-emerald-600">{devs.filter((d) => d.active).length}</p>
        </div>
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Total Stands</p>
          <p className="kpi-number mt-1 text-3xl font-semibold">{devs.reduce((s, d) => s + d.stands.length, 0)}</p>
        </div>
      </div>

      <section className="premium-panel mt-8">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Building2 className="size-4 text-primary" />
          <h2 className="font-semibold">Development Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Starting Price</th>
                <th className="px-4 py-3">Stands</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {devs.map((dev) => {
                const available = dev.stands.filter((s) => s.status === "AVAILABLE").length;
                return (
                  <tr key={dev.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{dev.name}</p>
                      <p className="text-xs text-muted-foreground">{dev.developerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="size-3" />{dev.location}, {dev.province}
                      </span>
                    </td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(parseFloat(dev.startingPrice))}</td>
                    <td className="kpi-number px-4 py-3">{dev.stands.length}</td>
                    <td className="kpi-number px-4 py-3 text-emerald-600">{available}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${dev.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {dev.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sysadmin/developments/${dev.slug}`}
                          className="rounded bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-muted/70"
                        >
                          Edit
                        </Link>
                        <form action={toggle}>
                          <input type="hidden" name="id" value={dev.id} />
                          <input type="hidden" name="active" value={String(dev.active)} />
                          <button
                            type="submit"
                            className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                              dev.active
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            }`}
                          >
                            {dev.active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {devs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No developments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
