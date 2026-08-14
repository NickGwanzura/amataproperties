import Link from "next/link";
import { CreditCard, Download, FileText, Map, Receipt, Wallet } from "lucide-react";
import { SectionTitle, StatusBadge } from "@/components/ui";
import { getClientByUserId } from "@/lib/db/queries/clients";
import { money } from "@/lib/utils";
import { getSessionUser } from "@/lib/session";
import { getSaleFinancialSnapshot } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const user = await getSessionUser();
  const client = user ? await getClientByUserId(user.id) : null;
  const sales = client?.sales ?? [];

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="Client Portal" title="Your property, balance, and documents in one place">
        Track instalments, download statements, and view your allocated stand.
      </SectionTitle>

      {sales.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <p className="font-semibold text-muted-foreground">No property allocation yet</p>
          <p className="text-sm text-muted-foreground">Your stand will appear here once your sale is processed.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {sales.map((sale) => {
            const allPayments = sale.payments ?? [];
            const finance = getSaleFinancialSnapshot(sale);
            const purchasePrice = finance.purchasePrice;
            const adminFees = finance.adminFees;
            const outstanding = finance.outstanding;
            const totalPaid = finance.propertyPaid;
            const progressPct = purchasePrice > 0 ? Math.min(100, Math.round((totalPaid / purchasePrice) * 100)) : 0;
            const recentPayments = allPayments.slice(0, 5);
            const lastVerified = allPayments.find((p) => p.status === "VERIFIED");

            return (
              <section key={sale.id} className="premium-panel">
                {/* Property header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {sale.development?.name}
                    </p>
                    <h2 className="mt-0.5 text-xl font-bold">Stand {sale.stand?.standNumber}</h2>
                    <p className="text-sm text-muted-foreground">{sale.stand?.sizeSqm} sqm · {sale.saleNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sale.status.replace("_", " ")} />
                    <a
                      href={`/api/client/statement/${sale.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                    >
                      <FileText className="size-3.5" /> Statement
                    </a>
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4">
                  {[
                    { label: "Purchase Price", value: money(purchasePrice), color: "" },
                    { label: "Total Paid", value: money(totalPaid), color: "text-emerald-700" },
                    { label: "Outstanding", value: money(outstanding), color: outstanding > 0 ? "text-red-600" : "text-emerald-700" },
                    ...(adminFees > 0
                      ? [{ label: "Admin Fees", value: money(adminFees), color: "text-amber-700" }]
                      : [{ label: "Progress", value: `${progressPct}%`, color: "" }]),
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-background px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                      <p className={`kpi-number mt-0.5 text-lg font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Links + recent payments */}
                <div className="grid gap-6 p-5 sm:grid-cols-2">
                  {/* Quick links */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</p>
                    {[
                      { href: `/client/statements`, label: "Account Statement", icon: Receipt },
                      { href: `/client/submit-payment`, label: "Submit Payment Proof", icon: CreditCard },
                      { href: `/client/payments`, label: "Payment History", icon: Wallet },
                      { href: `/client/documents`, label: "Documents", icon: FileText },
                      { href: `/client/map`, label: "Stand Map", icon: Map },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold transition hover:bg-muted"
                      >
                        <Icon className="size-4 text-primary" /> {label}
                      </Link>
                    ))}
                    {lastVerified && (
                      <a
                        href={`/api/client/receipt/${lastVerified.id}`}
                        target="_blank"
                        className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm font-semibold transition hover:bg-muted"
                      >
                        <Download className="size-4 text-primary" /> Latest Receipt
                      </a>
                    )}
                  </div>

                  {/* Recent payments */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Payments</p>
                    {recentPayments.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">No payments yet.</p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {recentPayments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between rounded border bg-background px-3 py-2 text-sm">
                            <div>
                              <span className="font-semibold">{money(parseFloat(p.amount))}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {new Date(p.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <StatusBadge status={p.status === "VERIFIED" ? "Approved" : p.status === "PENDING" ? "Pending" : "Rejected"} />
                          </div>
                        ))}
                        <Link href="/client/payments" className="block pt-1 text-right text-xs font-semibold text-primary hover:underline">
                          View all →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="border-t px-5 py-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Repayment Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
