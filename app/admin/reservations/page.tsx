import Link from "next/link";
import { SectionTitle, StatCard } from "@/components/ui";
import { getAllReservations } from "@/lib/db/queries/reservations";
import { adminUpdateReservationStatus } from "@/lib/actions";
import { ActionButton } from "@/components/action-button";
import { CheckCircle2, ExternalLink, Forward, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  PRESALE: "bg-orange-50 text-orange-800 ring-orange-200",
  AWAITING_DEPOSIT: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-800 ring-red-200",
  EXPIRED: "bg-muted text-muted-foreground ring-border",
};

export default async function AdminReservationsPage() {
  const reservations = await getAllReservations();

  const pending = reservations.filter((r) => r.status === "PENDING").length;
  const awaitingDeposit = reservations.filter((r) => r.status === "AWAITING_DEPOSIT").length;
  const approved = reservations.filter((r) => r.status === "APPROVED").length;
  const active = reservations.filter(
    (r) => r.status !== "CANCELLED" && r.status !== "EXPIRED",
  ).length;

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Admin: Reservations" title="All presales and reservations" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active" value={String(active)} />
        <StatCard label="Pending" value={String(pending)} />
        <StatCard label="Awaiting Deposit" value={String(awaitingDeposit)} />
        <StatCard label="Approved" value={String(approved)} />
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">All Reservations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{reservations.length} total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Stand</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No reservations yet.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const canApprove =
                    r.status === "AWAITING_DEPOSIT" || r.status === "PRESALE";
                  const canProgress = r.status === "PENDING";
                  const canCancel =
                    r.status !== "CANCELLED" &&
                    r.status !== "EXPIRED" &&
                    r.status !== "APPROVED";

                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="kpi-number px-4 py-3 font-semibold">{r.reference}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.client.name}</p>
                        <p className="text-xs text-muted-foreground">{r.client.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.development.name}</td>
                      <td className="kpi-number px-4 py-3 font-semibold">{r.stand.standNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.agent?.user?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_COLOR[r.status] ?? ""}`}
                        >
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {canApprove && (
                            <ActionButton
                              action={adminUpdateReservationStatus.bind(null, r.id, "APPROVED")}
                              successMsg="Reservation approved"
                              successDesc={`${r.reference} has been approved.`}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="size-3" />
                              Approve
                            </ActionButton>
                          )}
                          {canProgress && (
                            <ActionButton
                              action={adminUpdateReservationStatus.bind(null, r.id, "AWAITING_DEPOSIT")}
                              successMsg="Moved to Awaiting Deposit"
                              successDesc={`${r.reference} is now awaiting deposit.`}
                              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                            >
                              <Forward className="size-3" />
                              Await Deposit
                            </ActionButton>
                          )}
                          {canCancel && (
                            <ActionButton
                              action={adminUpdateReservationStatus.bind(null, r.id, "CANCELLED")}
                              successMsg="Reservation cancelled"
                              successDesc={`${r.reference} has been cancelled and stand released.`}
                              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100"
                            >
                              <XCircle className="size-3" />
                              Cancel
                            </ActionButton>
                          )}
                          {r.status === "APPROVED" && r.sale?.id && (
                            <Link
                              href={`/admin/sales/${r.sale.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
                            >
                              <ExternalLink className="size-3" />
                              View Sale
                            </Link>
                          )}
                        </div>
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
