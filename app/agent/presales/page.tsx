import Link from "next/link";
import { Ban, Banknote, CheckCircle2, ClipboardCheck, ExternalLink, Forward, Search, XCircle } from "lucide-react";
import { SectionTitle, StatusBadge } from "@/components/ui";
import {
  getAllReservations,
  cancelExpiredReservations,
  getReservationsByAgent,
} from "@/lib/db/queries/reservations";
import { money } from "@/lib/utils";
import {
  convertReservationToSale,
  rejectReservation,
  updateReservationStatus,
} from "@/lib/actions";
import { getCurrentAgentProfile } from "@/lib/agent";

export const dynamic = "force-dynamic";

const ACTION_GUIDE = [
  {
    label: "Presale",
    detail: "Use when the buyer has selected a stand and needs reservation confirmation.",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    label: "Await Deposit",
    detail: "Use after the buyer has accepted payment instructions and is ready to pay.",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-900",
  },
  {
    label: "Converted",
    detail: "Accounts confirms the deposit and completes the sale conversion.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
] as const;

export default async function AgentPresalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await cancelExpiredReservations();

  const agent = await getCurrentAgentProfile();
  const allReservations = agent
    ? await getReservationsByAgent(agent.id)
    : await getAllReservations();

  const { q } = await searchParams;
  const query = q?.trim().toLowerCase();
  const reservations = query
    ? allReservations.filter((r) => {
        const statusLabel = r.status.replace(/_/g, " ").toLowerCase();
        return (
          r.client.name.toLowerCase().includes(query) ||
          r.reference.toLowerCase().includes(query) ||
          r.stand.standNumber.toLowerCase().includes(query) ||
          r.development.name.toLowerCase().includes(query) ||
          statusLabel.includes(query)
        );
      })
    : allReservations;

  const active = reservations.filter(
    (r) =>
      r.status === "AWAITING_DEPOSIT" || r.status === "PRESALE" || r.status === "PENDING",
  );
  const approved = reservations.filter((r) => r.status === "APPROVED");
  const expired = reservations.filter(
    (r) => r.status === "EXPIRED" || r.status === "CANCELLED",
  );

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Agent: Presale Allocation"
        title="Active reservations and presale queue"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Active Presales</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-amber-700">{active.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Approved / Converted</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-emerald-700">{approved.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Expired / Cancelled</p>
          <p className="kpi-number mt-2 text-3xl font-semibold text-red-700">{expired.length}</p>
        </div>
      </div>

      <section className="premium-panel mt-8">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ClipboardCheck className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">How to Progress a Presale</h2>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {ACTION_GUIDE.map((item) => (
            <div key={item.label} className={`rounded-lg border p-4 ${item.tone}`}>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed opacity-80">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold">Presale Register</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {reservations.length} total reservation{reservations.length === 1 ? "" : "s"}
            </p>
          </div>
          <form method="GET" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search reservations…"
              className="h-9 w-56 rounded-lg border bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Development</th>
                <th className="px-4 py-3">Stand</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No reservations yet.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => {
                  const isPending = r.status === "PENDING";
                  const isPresale = r.status === "PRESALE";
                  const awaitingActions =
                    isPresale || r.status === "AWAITING_DEPOSIT";

                  return (
                    <tr key={r.id} className="border-t">
                      <td className="kpi-number px-4 py-3 font-semibold">
                        {r.reference}
                      </td>
                      <td className="px-4 py-3">{r.client.name}</td>
                      <td className="px-4 py-3">{r.development.name}</td>
                      <td className="kpi-number px-4 py-3 font-semibold">
                        {r.stand.standNumber}
                      </td>
                      <td className="kpi-number px-4 py-3">
                        {money(parseFloat(r.stand.price))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={r.status.replace("_", " ")}
                        />
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
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {isPending && (
                            <>
                              <form
                                action={updateReservationStatus.bind(
                                  null,
                                  r.id,
                                  "PRESALE",
                                )}
                              >
                                <button
                                  type="submit"
                                  title="Move to Presale"
                                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
                                >
                                  <Forward className="size-3" />
                                  Presale
                                </button>
                              </form>
                              <form
                                action={updateReservationStatus.bind(
                                  null,
                                  r.id,
                                  "AWAITING_DEPOSIT",
                                )}
                              >
                                <button
                                  type="submit"
                                  title="Mark as Awaiting Deposit"
                                  className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                                >
                                  <Banknote className="size-3" />
                                  Await Deposit
                                </button>
                              </form>
                            </>
                          )}
                          {isPresale && (
                            <form
                              action={updateReservationStatus.bind(
                                null,
                                r.id,
                                "AWAITING_DEPOSIT",
                              )}
                            >
                              <button
                                type="submit"
                                title="Mark as Awaiting Deposit"
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                              >
                                <Banknote className="size-3" />
                                Await Deposit
                              </button>
                            </form>
                          )}
                          {awaitingActions && (
                            <>
                              <form
                                action={convertReservationToSale.bind(
                                  null,
                                  r.id,
                                )}
                              >
                                <button
                                  type="submit"
                                  title="Quick approve with default deposit"
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                                >
                                  <CheckCircle2 className="size-3" />
                                  Approve
                                </button>
                              </form>
                              <form
                                action={rejectReservation.bind(
                                  null,
                                  r.id,
                                )}
                              >
                                <button
                                  type="submit"
                                  title="Reject / cancel reservation"
                                  className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-800 ring-1 ring-red-200 transition hover:bg-red-100"
                                >
                                  <XCircle className="size-3" />
                                  Reject
                                </button>
                              </form>
                            </>
                          )}
                          {r.status === "APPROVED" && (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                <CheckCircle2 className="size-3" />
                                Converted
                              </span>
                              {r.sale?.id && (
                                <Link
                                  href={`/agent/sales/${r.sale.id}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100"
                                >
                                  <ExternalLink className="size-3" />
                                  View Sale
                                </Link>
                              )}
                            </>
                          )}
                          {r.status === "EXPIRED" || r.status === "CANCELLED" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-1.5 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200">
                              <Ban className="size-3" />
                              Closed
                            </span>
                          ) : null}
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
