import { EmptyState, SectionTitle, StatusBadge } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getGroupByAdminUserId, getGroupMembers } from "@/lib/db/queries/groups";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GroupAdminMembersPage() {
  const user = await getSessionUser();
  const group = user ? await getGroupByAdminUserId(user.id) : null;

  if (!group) {
    return (
      <div className="dashboard-page">
        <SectionTitle eyebrow="Group Buying" title="Members" />
        <div className="mt-8">
          <EmptyState title="No group assigned" detail="You haven't been assigned to administer a group yet. Contact an administrator." />
        </div>
      </div>
    );
  }

  const members = await getGroupMembers(group.id);

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow={group.name} title="Members">
        {members.length} member{members.length === 1 ? "" : "s"}
      </SectionTitle>

      <section className="premium-panel mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Stand</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No members yet.</td></tr>
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
                      <td className="kpi-number px-4 py-3">{sale ? money(parseFloat(sale.outstandingBalance)) : "—"}</td>
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
      </section>
    </div>
  );
}
