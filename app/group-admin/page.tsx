import { EmptyState, SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getGroupByAdminUserId, getGroupKpis } from "@/lib/db/queries/groups";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GroupAdminDashboardPage() {
  const user = await getSessionUser();
  const group = user ? await getGroupByAdminUserId(user.id) : null;

  if (!group) {
    return (
      <div className="dashboard-page">
        <SectionTitle eyebrow="Group Buying" title="Group Dashboard" />
        <div className="mt-8">
          <EmptyState title="No group assigned" detail="You haven't been assigned to administer a group yet. Contact an administrator." />
        </div>
      </div>
    );
  }

  const kpis = await getGroupKpis(group.id);
  const collectionRate = kpis.totalValue > 0 ? (kpis.totalCollected / kpis.totalValue) * 100 : 0;

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow={group.development?.name ?? "—"} title={group.name}>
        <StatusBadge status={group.status} />
      </SectionTitle>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Members" value={String(kpis.memberCount)} />
        <StatCard label="Stands Allocated" value={String(kpis.allocatedStands)} />
        <StatCard label="Total Value" value={money(kpis.totalValue)} />
        <StatCard label="Deposits Collected" value={money(kpis.depositsCollected)} />
        <StatCard label="Outstanding" value={money(kpis.outstandingBalance)} />
        <StatCard label="Overdue Installments" value={String(kpis.overdueInstallments)} detail={`${collectionRate.toFixed(0)}% collected`} />
      </div>

      <div className="premium-panel mt-8 p-5">
        <h2 className="mb-2 text-lg font-semibold">Cash Flow</h2>
        <p className="text-sm text-muted-foreground">
          {money(kpis.totalCollected)} collected of {money(kpis.totalValue)} total value across {kpis.allocatedStands} allocated stand{kpis.allocatedStands === 1 ? "" : "s"}.
        </p>
        {kpis.overdueInstallments > 0 && (
          <p className="mt-2 text-sm font-semibold text-amber-700">{kpis.overdueInstallments} installment(s) overdue across the group&apos;s members.</p>
        )}
      </div>
    </div>
  );
}
