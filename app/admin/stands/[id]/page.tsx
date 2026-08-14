import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getStandById, getStandHistory } from "@/lib/db/queries/stands";
import { getAllClients } from "@/lib/db/queries/clients";
import { money } from "@/lib/utils";
import { StandDetailActions } from "./_detail-actions";

export const dynamic = "force-dynamic";

const HISTORY_LABELS: Record<string, string> = {
  ARCHIVED: "Archived",
  RESTORED: "Restored",
  RESERVED: "Reserved (manual hold)",
  RELEASED: "Released back to available",
  TRANSFERRED: "Transferred to a new owner",
};

export default async function StandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [stand, history, clients] = await Promise.all([
    getStandById(id),
    getStandHistory(id),
    getAllClients(),
  ]);

  if (!stand) notFound();

  const activeReservation = stand.reservations?.find((r) =>
    ["PENDING", "PRESALE", "AWAITING_DEPOSIT", "APPROVED"].includes(r.status),
  );

  return (
    <div className="dashboard-page">
      <Link href="/admin/stands" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Stands Register
      </Link>

      <SectionTitle eyebrow={stand.development?.name ?? "—"} title={`Stand ${stand.standNumber}`}>
        <StatusBadge status={stand.status} />
      </SectionTitle>

      {(stand.archivedAt || stand.deletedAt) && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This stand is {stand.deletedAt ? "soft-deleted" : "archived"} and hidden from the active register.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Size" value={`${stand.sizeSqm} m²`} />
        <StatCard label="Price" value={money(parseFloat(stand.price))} />
        <StatCard label="Phase" value={stand.phase} />
        <StatCard label="Status" value={stand.status} />
      </div>

      <div className="premium-panel mt-6 p-5">
        <h2 className="mb-3 text-lg font-semibold">Actions</h2>
        <StandDetailActions
          standId={stand.id}
          status={stand.status}
          archivedAt={stand.archivedAt}
          deletedAt={stand.deletedAt}
          clients={clients.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        />
      </div>

      {stand.sale && (
        <div className="premium-panel mt-6 p-5">
          <h2 className="mb-3 text-lg font-semibold">Current Sale</h2>
          <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <div><dt className="inline text-muted-foreground">Sale #: </dt><dd className="inline font-medium">{stand.sale.saleNumber}</dd></div>
            <div><dt className="inline text-muted-foreground">Client: </dt><dd className="inline font-medium">{stand.sale.client?.name ?? "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Purchase Price: </dt><dd className="inline font-medium">{money(parseFloat(stand.sale.purchasePrice))}</dd></div>
            <div><dt className="inline text-muted-foreground">Outstanding: </dt><dd className="inline font-medium">{money(parseFloat(stand.sale.outstandingBalance))}</dd></div>
          </dl>
          <Link href={`/sysadmin/sales/${stand.sale.id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            View sale →
          </Link>
        </div>
      )}

      {activeReservation && !stand.sale && (
        <div className="premium-panel mt-6 p-5">
          <h2 className="mb-3 text-lg font-semibold">Active Reservation</h2>
          <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            <div><dt className="inline text-muted-foreground">Reference: </dt><dd className="inline font-medium">{activeReservation.reference}</dd></div>
            <div><dt className="inline text-muted-foreground">Client: </dt><dd className="inline font-medium">{activeReservation.client?.name ?? "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Status: </dt><dd className="inline font-medium">{activeReservation.status}</dd></div>
            {activeReservation.message && <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Note: </dt><dd className="inline">{activeReservation.message}</dd></div>}
          </dl>
        </div>
      )}

      <div className="premium-panel mt-6 p-5">
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="border-l-2 border-primary/30 pl-4">
                <p className="text-sm font-semibold">{HISTORY_LABELS[h.eventType] ?? h.eventType}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString()} {h.user?.name ? `· ${h.user.name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
