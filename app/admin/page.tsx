import Link from "next/link";
import { Building2, Handshake, Map, Users } from "lucide-react";
import { DashboardAlerts } from "@/components/dashboard-alerts";
import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getExecutiveStats } from "@/lib/db/queries/admin";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { getRecentActiveReservations } from "@/lib/db/queries/reservations";
import { money, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

const quickLinks = [
  { label: "Developments", desc: "Onboard & manage estates", href: "/admin/developments", icon: Building2 },
  { label: "Stand Management", desc: "View & update stand status", href: "/admin/stands", icon: Map },
  { label: "Reservations", desc: "Approve & track presales", href: "/admin/reservations", icon: Handshake },
  { label: "Agents & Users", desc: "Roles, access, & profiles", href: "/admin/users", icon: Users },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q } = {}, stats, devs, recentPresales] = await Promise.all([
    searchParams,
    getExecutiveStats(),
    getAllDevelopmentsWithStandCounts(),
    getRecentActiveReservations(10),
  ]);

  const expiringPresales = recentPresales.filter((reservation) =>
    reservation.expiresAt && new Date(reservation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
  ).length;
  const inactiveDevelopments = devs.filter((development) => !development.active).length;
  const adminAlerts = [
    ...(expiringPresales > 0 ? [{
      title: `${expiringPresales} reservations expire within 24 hours`,
      detail: "Follow up on deposits or release the stands so inventory stays accurate.",
      href: "/admin/reservations",
      label: "Review",
      tone: "warning" as const,
    }] : []),
    ...(inactiveDevelopments > 0 ? [{
      title: `${inactiveDevelopments} developments are inactive`,
      detail: "Confirm archived developments do not still have active reservations or sales.",
      href: "/admin/developments",
      label: "Developments",
      tone: "info" as const,
    }] : []),
  ];

  const filtered = q
    ? devs.filter(
        (d) =>
          d.name.toLowerCase().includes(q.toLowerCase()) ||
          d.location.toLowerCase().includes(q.toLowerCase())
      )
    : devs;

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="Administrator" title="Operations command centre" />

      <DashboardAlerts alerts={adminAlerts} className="mt-6" />

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

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((ql) => (
          <Link
            key={ql.href}
            href={ql.href}
            className="premium-panel p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ql.icon className="size-8 text-primary" />
            <p className="mt-3 font-semibold">{ql.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{ql.desc}</p>
          </Link>
        ))}
      </div>

      {recentPresales.length > 0 && (
        <section className="premium-panel mt-10">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <Handshake className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Active Presales & Reservations</h2>
            </div>
            <Link
              href="/admin/reservations"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expires</th>
                </tr>
              </thead>
              <tbody>
                {recentPresales.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="kpi-number px-4 py-3 font-semibold">{r.reference}</td>
                    <td className="px-4 py-3 font-medium">{r.client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.development.name}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{r.stand.standNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.agent?.user?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status.replace(/_/g, " ")} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.expiresAt
                        ? new Date(r.expiresAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="premium-panel mt-10">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Developments</h2>
            <form method="GET" className="ml-4">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by name or location..."
                className="h-9 rounded border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/api/reports/stands/csv"
              className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5"
            >
              Download CSV
            </Link>
            <Link
              href="/admin/developments"
              className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5"
            >
              Manage All
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Deposit</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Presale</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No developments yet.</td>
                </tr>
              ) : filtered.map((dev) => {
                const available = dev.stands.filter((s) => s.status === "AVAILABLE").length;
                const presale = dev.stands.filter((s) => s.status === "PRESALE").length;
                const reserved = dev.stands.filter((s) => s.status === "RESERVED").length;
                const sold = dev.stands.filter((s) => s.status === "SOLD").length;
                return (
                  <tr key={dev.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{dev.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dev.location}</td>
                    <td className="kpi-number px-4 py-3">{money(parseFloat(dev.depositAmount))}</td>
                    <td className="kpi-number px-4 py-3 font-semibold text-emerald-700">{available}</td>
                    <td className="kpi-number px-4 py-3 font-semibold text-amber-700">{presale}</td>
                    <td className="kpi-number px-4 py-3 font-semibold text-blue-700">{reserved}</td>
                    <td className="kpi-number px-4 py-3 font-semibold text-primary">{sold}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${dev.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                        {dev.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
