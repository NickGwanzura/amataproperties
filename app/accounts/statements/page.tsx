export const dynamic = "force-dynamic";

import { Download, FileText, Receipt, Search } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { getAllSales } from "@/lib/db/queries/sales";
import { money } from "@/lib/utils";
import { getSaleFinancialSnapshot } from "@/lib/finance";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-sky-50 text-sky-800 border-sky-200",
  DEFAULTED: "bg-red-50 text-red-800 border-red-200",
  CANCELLED: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

export default async function AccountsStatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const allSales = await getAllSales();

  const filtered = allSales.filter((s) => {
    if (status && status !== "ALL" && s.status !== status) return false;
    if (q) {
      const query = q.toLowerCase();
      return (
        s.client?.name?.toLowerCase().includes(query) ||
        s.client?.email?.toLowerCase().includes(query) ||
        s.saleNumber?.toLowerCase().includes(query) ||
        s.stand?.standNumber?.toLowerCase().includes(query) ||
        s.development?.name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeSales = allSales.filter((s) => s.status === "ACTIVE");
  const totalOutstanding = activeSales.reduce(
    (sum, s) => sum + getSaleFinancialSnapshot(s).outstanding,
    0,
  );

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Accounts: Statements & Receipts" title="Client Documents">
        Download account statements or view payment receipts for any client sale.
      </SectionTitle>

      {/* KPI strip */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Sales
          </p>
          <p className="kpi-number mt-1 text-2xl font-semibold">{allSales.length}</p>
        </div>
        <div className="premium-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active Sales
          </p>
          <p className="kpi-number mt-1 text-2xl font-semibold">{activeSales.length}</p>
        </div>
        <div className="premium-panel p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Outstanding
          </p>
          <p className="kpi-number mt-1 text-2xl font-semibold">{money(totalOutstanding)}</p>
        </div>
      </div>

      {/* Search + filter */}
      <section className="premium-panel mt-6">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <FileText className="size-5 text-primary" />
                Sale Records
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {filtered.length} of {allSales.length} sales
              </p>
            </div>

            <form method="GET" className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Client, sale #, stand, development…"
                  className="h-9 w-60 rounded-lg border border-border/70 bg-background pl-8 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <select
                name="status"
                defaultValue={status ?? "ALL"}
                className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="DEFAULTED">Defaulted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Search className="size-3.5" />
                Search
              </button>
              {(q || (status && status !== "ALL")) && (
                <Link
                  href="/accounts/statements"
                  className="inline-flex h-9 items-center px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FileText className="mx-auto mb-3 size-8 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No sales match your search.</p>
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="divide-y sm:hidden">
              {filtered.map((sale) => (
                <div key={sale.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{sale.client?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{sale.client?.email ?? "—"}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${statusColors[sale.status] ?? "bg-zinc-50 text-zinc-600 border-zinc-200"}`}
                    >
                      {sale.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sale.saleNumber} &middot; {sale.development?.name ?? "—"} &middot; Stand {sale.stand?.standNumber ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Outstanding: <span className="kpi-number font-semibold text-foreground">{money(getSaleFinancialSnapshot(sale).outstanding)}</span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/api/client/statement/${sale.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:translate-y-px"
                    >
                      <Download className="size-3.5" />
                      Statement
                    </a>
                    <Link
                      href={`/accounts/statements/${sale.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition active:translate-y-px"
                    >
                      <Receipt className="size-3.5" />
                      Receipts
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Sale #</th>
                    <th className="px-4 py-3">Development / Stand</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Statement</th>
                    <th className="px-4 py-3">Receipts</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => (
                    <tr key={sale.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{sale.client?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{sale.client?.email ?? "—"}</p>
                      </td>
                      <td className="kpi-number px-4 py-3 font-semibold text-muted-foreground">
                        {sale.saleNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{sale.development?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          Stand {sale.stand?.standNumber ?? "—"}
                        </p>
                      </td>
                      <td className="kpi-number px-4 py-3 font-semibold">
                        {money(getSaleFinancialSnapshot(sale).outstanding)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${statusColors[sale.status] ?? "bg-zinc-50 text-zinc-600 border-zinc-200"}`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/client/statement/${sale.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
                        >
                          <Download className="size-3.5" />
                          PDF
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/accounts/statements/${sale.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                        >
                          <Receipt className="size-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
