export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { SectionTitle, LoadingState } from "@/components/ui";
import { getSalesRegisterData } from "@/lib/db/queries/sales";
import { getAllPayments } from "@/lib/db/queries/payments";
import { money, percent } from "@/lib/utils";
import { SalesRegister } from "../../sysadmin/sales/_sales-register";

export default async function CeoReportsPage() {
  const [sales, payments] = await Promise.all([
    getSalesRegisterData(),
    getAllPayments(),
  ]);

  const activeSales = sales.filter((s) => s.status === "ACTIVE").length;
  const verified = payments.filter((p) => p.status === "VERIFIED");
  const totalCollected = verified.reduce((s, p) => s + parseFloat(p.amount as string), 0);
  const totalRevenue = sales.reduce((s, sale) => s + parseFloat(sale.purchasePrice as string), 0);

  const reports = [
    {
      title: "Sales Register",
      description: `${sales.length} sales · ${money(totalRevenue)} contract value`,
      href: "/api/reports/sales/csv",
      xlsxHref: "/api/reports/sales/xlsx",
      icon: FileSpreadsheet,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Installment Revenue",
      description: "Monthly collections by development",
      href: "/api/reports/installment-revenue/csv",
      xlsxHref: "/api/reports/installment-revenue/xlsx",
      icon: FileSpreadsheet,
      color: "text-primary bg-primary/5 border-primary/20",
    },
    {
      title: "Revenue Report (PDF)",
      description: "Formatted PDF for board presentation",
      href: "/api/reports/installment-revenue/pdf",
      format: "PDF",
      icon: FileText,
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
    {
      title: "Sales Report (PDF)",
      description: "Formatted current sales register for board presentation",
      href: "/api/reports/sales/pdf",
      format: "PDF",
      icon: FileText,
      color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    },
    {
      title: "Agent Performance",
      description: "Rank agents by revenue and commission earned",
      href: "/api/reports/agents/csv",
      xlsxHref: "/api/reports/agents/xlsx",
      icon: FileSpreadsheet,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Reservations Pipeline",
      description: "All reservations by status and development",
      href: "/api/reports/reservations/csv",
      xlsxHref: "/api/reports/reservations/xlsx",
      icon: FileSpreadsheet,
      color: "text-violet-700 bg-violet-50 border-violet-200",
    },
    {
      title: "Stand Inventory",
      description: "Full stand inventory across all developments",
      href: "/api/reports/stands/csv",
      xlsxHref: "/api/reports/stands/xlsx",
      icon: FileSpreadsheet,
      color: "text-sky-700 bg-sky-50 border-sky-200",
    },
  ];

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="CEO: Reports" title="Executive data exports">
        Download structured data exports for board reporting, investor decks, and
        offline analysis.
      </SectionTitle>

      {/* KPI strip */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Sales", value: String(activeSales) },
          { label: "Total Revenue", value: money(totalRevenue) },
          { label: "Cash Collected", value: money(totalCollected) },
          { label: "Collection Rate", value: percent(totalRevenue > 0 ? totalCollected / totalRevenue : 0) },
        ].map((k) => (
          <div key={k.label} className="premium-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold kpi-number">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Reports */}
      <section className="premium-panel mt-8 divide-y">
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold">Available Reports</h2>
          <p className="text-sm text-muted-foreground">CSV files open in Excel / Google Sheets. PDF suitable for print.</p>
        </div>
        {reports.map((r) => (
          <div key={r.title} className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/30">
            <span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${r.color}`}>
              <r.icon className="size-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {"xlsxHref" in r && r.xlsxHref ? (
                <>
                  <a
                    href={r.href}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-px hover:bg-muted"
                  >
                    <Download className="size-3.5" />
                    CSV
                  </a>
                  <a
                    href={r.xlsxHref}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
                  >
                    <Download className="size-3.5" />
                    Excel
                  </a>
                </>
              ) : (
                <>
                  <span className="rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {r.format}
                  </span>
                  <a
                    href={r.href}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
                  >
                    <Download className="size-3.5" />
                    Download
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Sales Register */}
      <div className="mt-12">
        <Suspense fallback={<LoadingState label="Loading sales register" />}>
          <SalesRegister
            sales={sales}
            developments={[...new Set(sales.map((s) => s.development?.name).filter(Boolean))].sort()}
            statuses={["ACTIVE", "PAID_OFF", "DEFAULTED", "CANCELLED"]}
            initialQ=""
            initialStatus=""
            initialDev=""
            actionsEnabled={false}
            basePath="/ceo/sales"
            title="Sales Register"
          />
        </Suspense>
      </div>
    </div>
  );
}
