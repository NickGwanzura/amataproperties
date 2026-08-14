import { SectionTitle, StatCard } from "@/components/ui";
import { getAllClientsWithRecords } from "@/lib/db/queries/clients";
import { money } from "@/lib/utils";
import { Users, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SysadminClientsPage() {
  const clients = await getAllClientsWithRecords();

  const totalRevenue = clients.reduce(
    (sum, c) =>
      sum +
      (c.sales ?? []).reduce(
        (s, sale) => s + parseFloat(sale.purchasePrice),
        0,
      ),
    0,
  );
  const kycComplete = clients.filter((c) => c.kycStatus === "COMPLETE").length;
  const kycNotStarted = clients.filter((c) => c.kycStatus === "NOT_STARTED").length;
  const withSales = clients.filter((c) => (c.sales ?? []).length > 0).length;

  const kycColors: Record<string, string> = {
    COMPLETE: "text-emerald-600 bg-emerald-50 border-emerald-200",
    IN_REVIEW: "text-amber-600 bg-amber-50 border-amber-200",
    NOT_STARTED: "text-muted-foreground bg-muted border-border",
    REJECTED: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Sysadmin: Clients"
        title="All registered clients and their records"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Clients" value={String(clients.length)} />
        <StatCard label="With Sales" value={String(withSales)} detail={`${((withSales / clients.length) * 100).toFixed(0)}% of clients`} />
        <StatCard label="KYC Complete" value={String(kycComplete)} />
        <StatCard label="KYC Not Started" value={String(kycNotStarted)} />
        <StatCard label="Total Revenue" value={money(totalRevenue)} />
      </div>

      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" />
            All Clients
          </h2>
          <span className="text-sm text-muted-foreground">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">National ID</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Reservations</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No clients registered yet.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="kpi-number px-4 py-3">{c.phone}</td>
                    <td className="kpi-number px-4 py-3 text-xs text-muted-foreground">
                      {c.nationalId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                          kycColors[c.kycStatus] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.kycStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="kpi-number px-4 py-3 font-semibold">
                      {c.sales?.length ?? 0}
                    </td>
                    <td className="kpi-number px-4 py-3">{c.reservations?.length ?? 0}</td>
                    <td className="kpi-number px-4 py-3">{c.leads?.length ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(c.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Client detail cards for clients with sales */}
      {clients.filter((c) => (c.sales ?? []).length > 0).length > 0 && (
        <section className="premium-panel mt-8">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="size-5 text-primary" />
              Clients with Sales
            </h2>
          </div>
          <div className="divide-y">
            {clients
              .filter((c) => (c.sales ?? []).length > 0)
              .map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.email} &middot; {c.phone}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600">
                      {c.sales?.length ?? 0} sale{(c.sales?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Sales for this client */}
                  {(c.sales ?? []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {c.sales!.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-xs"
                        >
                          <span className="kpi-number font-semibold">{s.saleNumber}</span>
                          <span className="text-muted-foreground">
                            {s.development?.name ?? "—"} &middot; Stand {s.stand?.standNumber ?? "—"}
                          </span>
                          <span className="kpi-number font-semibold">
                            {money(parseFloat(s.purchasePrice))}
                          </span>
                          <span className="text-muted-foreground">
                            Paid: {money(parseFloat(s.depositPaid))}
                          </span>
                          <span className="kpi-number text-amber-600 font-semibold">
                            Balance: {money(parseFloat(s.outstandingBalance))}
                          </span>
                          <span
                            className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              s.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700"
                                : s.status === "PAID_OFF"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {s.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payments for this client */}
                  {(c.sales ?? []).some((s) => (s.payments ?? []).length > 0) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                        View payment history
                      </summary>
                      <div className="mt-2 space-y-1">
                        {c.sales!.map((s) =>
                          (s.payments ?? []).map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 rounded bg-background px-2.5 py-1.5 text-[11px]"
                            >
                              <span className="text-muted-foreground">
                                {new Date(p.paidAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                              <span className="kpi-number font-semibold">
                                {money(parseFloat(p.amount))}
                              </span>
                              <span className="text-muted-foreground">{p.method}</span>
                              <span className="font-mono text-muted-foreground/60 text-[10px]">
                                {p.reference}
                              </span>
                              <span
                                className={`ml-auto rounded-full px-1.5 py-px text-[9px] font-semibold ${
                                  p.status === "VERIFIED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : p.status === "FAILED"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>
                          )),
                        )}
                      </div>
                    </details>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
