import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getGroupById, getGroupKpis, getGroupMembers } from "@/lib/db/queries/groups";
import { money } from "@/lib/utils";
import { GroupAdminActions } from "./_admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [group, kpis, members] = await Promise.all([getGroupById(id), getGroupKpis(id), getGroupMembers(id)]);
  if (!group) notFound();

  return (
    <div className="dashboard-page">
      <Link href="/admin/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Groups
      </Link>

      <SectionTitle eyebrow={group.development?.name ?? "—"} title={group.name}>
        <StatusBadge status={group.status} />
      </SectionTitle>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Members" value={String(kpis.memberCount)} />
        <StatCard label="Stands Allocated" value={String(kpis.allocatedStands)} />
        <StatCard label="Collected" value={money(kpis.totalCollected)} />
        <StatCard label="Outstanding" value={money(kpis.outstandingBalance)} />
      </div>

      <div className="premium-panel mt-6 p-5">
        <h2 className="mb-3 text-lg font-semibold">Group Administrator</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {group.groupAdmin ? `${group.groupAdmin.name} (${group.groupAdmin.email})` : "No administrator assigned yet."}
        </p>
        <GroupAdminActions groupId={group.id} hasAdmin={!!group.groupAdmin} />
      </div>

      <div className="premium-panel mt-6 p-5">
        <h2 className="mb-3 text-lg font-semibold">Organisation Details</h2>
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <div><dt className="inline text-muted-foreground">Type: </dt><dd className="inline font-medium">{group.orgType}</dd></div>
          <div><dt className="inline text-muted-foreground">Registration #: </dt><dd className="inline font-medium">{group.registrationNumber ?? "—"}</dd></div>
          <div><dt className="inline text-muted-foreground">Contact: </dt><dd className="inline font-medium">{group.contactPersonName}</dd></div>
          <div><dt className="inline text-muted-foreground">Email: </dt><dd className="inline font-medium">{group.contactPersonEmail}</dd></div>
          <div><dt className="inline text-muted-foreground">Phone: </dt><dd className="inline font-medium">{group.contactPersonPhone}</dd></div>
          <div><dt className="inline text-muted-foreground">Address: </dt><dd className="inline font-medium">{group.address ?? "—"}</dd></div>
        </dl>
      </div>

      <div className="premium-panel mt-6">
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Members</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{members.length} members</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/api/reports/group-members/csv?groupId=${group.id}`} className="rounded border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted">CSV</a>
              <a href={`/api/reports/group-members/xlsx?groupId=${group.id}`} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:-translate-y-px">Excel</a>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Stand</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No members imported yet.</td></tr>
              ) : (
                members.map((m) => {
                  const sale = m.sales?.[0];
                  const reservation = m.reservations?.[0];
                  return (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3 font-semibold">{m.name}</td>
                      <td className="px-4 py-3">{m.email}</td>
                      <td className="px-4 py-3">{m.phone}</td>
                      <td className="kpi-number px-4 py-3">{sale?.stand?.standNumber ?? reservation?.stand?.standNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        {sale ? <StatusBadge status={sale.status} /> : reservation ? <StatusBadge status={reservation.status} /> : <span className="text-xs text-muted-foreground">Unallocated</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
