import Link from "next/link";
import { Plus } from "lucide-react";
import { SectionTitle, StatusBadge } from "@/components/ui";
import { getAllGroups } from "@/lib/db/queries/groups";
import { getGroupKpis } from "@/lib/db/queries/groups";
import { money } from "@/lib/utils";
import { GroupArchiveButton, GroupPublishButton } from "./_group-actions";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const allGroups = await getAllGroups();
  const withKpis = await Promise.all(
    allGroups.map(async (g) => ({ group: g, kpis: await getGroupKpis(g.id) })),
  );

  return (
    <div className="dashboard-page">
      <div className="flex items-center justify-between">
        <SectionTitle eyebrow="Admin: Group Buying" title="Groups">
          Organisations buying multiple stands for their members.
        </SectionTitle>
        <Link
          href="/admin/groups/new"
          className="inline-flex h-11 items-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5"
        >
          <Plus className="size-4" /> New Group
        </Link>
      </div>

      {withKpis.length === 0 ? (
        <div className="premium-panel mt-8 p-10 text-center text-muted-foreground">No groups yet. Create one to get started.</div>
      ) : (
        <div className="mt-8 space-y-4">
          {withKpis.map(({ group, kpis }) => (
            <div key={group.id} className="premium-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/groups/${group.id}`} className="text-lg font-semibold hover:underline">{group.name}</Link>
                    <StatusBadge status={group.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.orgType} · {group.development?.name ?? "—"} · {group.contactPersonName}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Admin: {group.groupAdmin?.name ?? <span className="text-amber-700">Not assigned</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {group.status === "DRAFT" && <GroupPublishButton id={group.id} />}
                  {group.status !== "ARCHIVED" && <GroupArchiveButton id={group.id} />}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded border p-2.5">
                  <p className="text-[11px] uppercase text-muted-foreground">Members</p>
                  <p className="kpi-number font-semibold">{kpis.memberCount}</p>
                </div>
                <div className="rounded border p-2.5">
                  <p className="text-[11px] uppercase text-muted-foreground">Stands Allocated</p>
                  <p className="kpi-number font-semibold">{kpis.allocatedStands}</p>
                </div>
                <div className="rounded border p-2.5">
                  <p className="text-[11px] uppercase text-muted-foreground">Collected</p>
                  <p className="kpi-number font-semibold">{money(kpis.totalCollected)}</p>
                </div>
                <div className="rounded border p-2.5">
                  <p className="text-[11px] uppercase text-muted-foreground">Outstanding</p>
                  <p className="kpi-number font-semibold">{money(kpis.outstandingBalance)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
