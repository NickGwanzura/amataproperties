import { FileDown } from "lucide-react";
import { EmptyState, SectionTitle } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { getGroupByAdminUserId } from "@/lib/db/queries/groups";

export const dynamic = "force-dynamic";

export default async function GroupAdminReportsPage() {
  const user = await getSessionUser();
  const group = user ? await getGroupByAdminUserId(user.id) : null;

  if (!group) {
    return (
      <div className="dashboard-page">
        <SectionTitle eyebrow="Group Buying" title="Reports" />
        <div className="mt-8">
          <EmptyState title="No group assigned" detail="You haven't been assigned to administer a group yet. Contact an administrator." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow={group.name} title="Reports" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a
          href={`/api/reports/group-members/csv?groupId=${group.id}`}
          className="premium-panel flex items-center gap-3 p-5 transition hover:-translate-y-0.5"
        >
          <FileDown className="size-6 text-primary" />
          <div>
            <p className="font-semibold">Members CSV Export</p>
            <p className="text-sm text-muted-foreground">Full member list with allocation and outstanding balance.</p>
          </div>
        </a>
        <a
          href={`/api/reports/group-members/xlsx?groupId=${group.id}`}
          className="premium-panel flex items-center gap-3 p-5 transition hover:-translate-y-0.5"
        >
          <FileDown className="size-6 text-primary" />
          <div>
            <p className="font-semibold">Members Excel Export</p>
            <p className="text-sm text-muted-foreground">Same member list, formatted as an .xlsx workbook.</p>
          </div>
        </a>
        <a
          href={`/api/reports/group-members/pdf?groupId=${group.id}`}
          className="premium-panel flex items-center gap-3 p-5 transition hover:-translate-y-0.5"
        >
          <FileDown className="size-6 text-primary" />
          <div>
            <p className="font-semibold">Group Sales Report (PDF)</p>
            <p className="text-sm text-muted-foreground">Printable summary of all sales allocated to this group&apos;s members.</p>
          </div>
        </a>
      </div>
    </div>
  );
}
