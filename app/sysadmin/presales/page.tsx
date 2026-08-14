import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getAllReservations, cancelExpiredReservations } from "@/lib/db/queries/reservations";
import { sysadminRecordSaleAction } from "@/lib/actions";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const METHOD_OPTIONS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ECOCASH",       label: "EcoCash" },
  { value: "OTHER",         label: "Other" },
];

export default async function SysadminPresalesPage() {
  await cancelExpiredReservations();
  const all = await getAllReservations();

  const active   = all.filter((r) => ["PRESALE", "AWAITING_DEPOSIT", "PENDING"].includes(r.status));
  const approved = all.filter((r) => r.status === "APPROVED");
  const closed   = all.filter((r) => ["EXPIRED", "CANCELLED"].includes(r.status));

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Sysadmin: Presale Management"
        title="Record and convert presales to sales"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Presales"     value={String(active.length)} />
        <StatCard label="Converted to Sale"   value={String(approved.length)} />
        <StatCard label="Expired / Cancelled" value={String(closed.length)} />
      </div>

      {/* ── Active presales with Record Sale forms ── */}
      <section className="premium-panel mt-8">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ClipboardList className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Active Presales</h2>
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {active.length}
          </span>
        </div>

        {active.length === 0 ? (
          <p className="px-5 py-10 text-center text-muted-foreground">No active presales.</p>
        ) : (
          <div className="divide-y">
            {active.map((r) => (
              <div key={r.id} className="px-5 py-5">
                {/* Reservation header */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="kpi-number text-sm font-bold">{r.reference}</span>
                  <StatusBadge status={r.status.replace(/_/g, " ")} />
                  {r.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      Expires {new Date(r.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span><strong>Client:</strong> {r.client.name}</span>
                  <span><strong>Development:</strong> {r.development.name}</span>
                  <span><strong>Stand:</strong> {r.stand.standNumber} ({r.stand.sizeSqm} sqm)</span>
                  <span><strong>Stand Price:</strong> {money(parseFloat(r.stand.price))}</span>
                  {r.agent?.user && <span><strong>Agent:</strong> {r.agent.user.name}</span>}
                </div>

                {/* Record Sale form */}
                <form
                  action={sysadminRecordSaleAction.bind(null, r.id)}
                  className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                    Record Sale
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Deposit Amount (USD) *
                      </label>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        placeholder={r.development.depositAmount}
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Payment Method *
                      </label>
                      <select
                        name="method"
                        required
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {METHOD_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Receipt / Reference *
                      </label>
                      <input
                        name="reference"
                        type="text"
                        required
                        placeholder="e.g. 1123"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Admin Fee (USD) *
                      </label>
                      <input
                        name="adminFee"
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        defaultValue="300"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Notes (optional)
                    </label>
                    <input
                      name="notes"
                      type="text"
                      placeholder="e.g. Cash received at office"
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <CheckCircle2 className="size-4" />
                      Confirm Sale
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Converted sales ── */}
      {approved.length > 0 && (
        <section className="premium-panel mt-8">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-xl font-semibold">Converted to Sale</h2>
            <Link href="/sysadmin/sales" className="text-sm font-semibold text-primary hover:underline">
              Sales Register →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {approved.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="kpi-number px-4 py-3 font-semibold">{r.reference}</td>
                    <td className="px-4 py-3">{r.client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.development.name}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{r.stand.standNumber}</td>
                    <td className="kpi-number px-4 py-3">{money(parseFloat(r.stand.price))}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      {r.sale?.id && (
                        <Link
                          href={`/sysadmin/sales/${r.sale.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          View Sale <ArrowRight className="size-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
