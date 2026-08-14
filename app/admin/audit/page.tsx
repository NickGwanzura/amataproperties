import { Suspense } from "react";
import { SectionTitle, LoadingState } from "@/components/ui";
import { getAuditLogsPaginated, getAuditLogsCount } from "@/lib/db/queries/audit";
import AuditLogTable from "@/components/audit-log-table";
import type { AuditLog } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  mod?: string;
  limit?: string;
  offset?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const selectedModule = sp.mod ?? "ALL";
  const limit = Math.min(parseInt(sp.limit ?? "100"), 500);
  const offset = Math.max(0, parseInt(sp.offset ?? "0"));
  const search = sp.search ?? "";
  const dateFrom = sp.dateFrom ?? "";
  const dateTo = sp.dateTo ?? "";

  const [logs, total] = await Promise.all([
    getAuditLogsPaginated({ limit, offset, module: selectedModule, search, dateFrom, dateTo }),
    getAuditLogsCount({ module: selectedModule, search, dateFrom, dateTo }),
  ]);

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Admin: Audit Log" title="Full action trail across all modules" />

      <Suspense fallback={<LoadingState label="Loading audit trail" />}>
        <AuditLogTable
          logs={logs as (AuditLog & { user?: { id: string; name: string; email: string } | null })[]}
          total={total}
          limit={limit}
          offset={offset}
          module={selectedModule}
          search={search}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </Suspense>
    </div>
  );
}
