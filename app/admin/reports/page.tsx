export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { SectionTitle, LoadingState } from "@/components/ui";
import { getSalesRegisterData } from "@/lib/db/queries/sales";
import { getAllDevelopmentsWithStandCounts } from "@/lib/db/queries/developments";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { SalesRegister } from "../../sysadmin/sales/_sales-register";

export default async function AdminReportsPage() {
  const [sales, developments] = await Promise.all([
    getSalesRegisterData(),
    getAllDevelopmentsWithStandCounts(),
  ]);

  const reservationCount = await db.query.reservations.findMany({ columns: { id: true } }).then((r) => r.length);
  const totalStands = developments.reduce((s, d) => s + d.stands.length, 0);
  const totalRevenue = sales.reduce((s, sale) => s + parseFloat(sale.purchasePrice as string), 0);
  const totalOutstanding = sales.reduce((s, sale) => s + parseFloat(sale.outstandingBalance as string), 0);

  const reports = [
    {
      title: "Sales Register",
      description: `${sales.length} sales · ${money(totalRevenue)} total contract value`,
      href: "/api/reports/sales/csv",
      xlsxHref: "/api/reports/sales/xlsx",
      icon: FileSpreadsheet,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Stand Inventory",
      description: `${totalStands} stands across ${developments.length} development${developments.length !== 1 ? "s" : ""}`,
      href: "/api/reports/stands/csv",
      xlsxHref: "/api/reports/stands/xlsx",
      icon: FileSpreadsheet,
      color: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      title: "Reservations Report",
      description: `${reservationCount} total reservations on record`,
      href: "/api/reports/reservations/csv",
      xlsxHref: "/api/reports/reservations/xlsx",
      icon: FileSpreadsheet,
      color: "text-violet-700 bg-violet-50 border-violet-200",
    },
    {
      title: "Agent Performance",
      description: "Sales count, revenue, and commissions per agent",
      href: "/api/reports/agents/csv",
      xlsxHref: "/api/reports/agents/xlsx",
      icon: FileSpreadsheet,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Installment Revenue",
      description: "Collections by development and month",
      href: "/api/reports/installment-revenue/csv",
      xlsxHref: "/api/reports/installment-revenue/xlsx",
      icon: FileSpreadsheet,
      color: "text-primary bg-primary/5 border-primary/20",
    },
    {
      title: "Audit Log",
      description: "Last 5,000 system events",
      href: "/api/reports/audit/csv",
      xlsxHref: "/api/reports/audit/xlsx",
      icon: FileText,
      color: "text-slate-700 bg-slate-50 border-slate-200",
    },
  ];

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Admin: Reports" title="Export operational data">
        Download CSV snapshots of key business data for offline analysis or
        compliance purposes.
      </SectionTitle>

      {/* KPI strip */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Sales", value: String(sales.filter((s) => s.status === "ACTIVE").length) },
          { label: "Total Stands", value: String(totalStands) },
          { label: "Total Revenue", value: money(totalRevenue) },
          { label: "Outstanding", value: money(totalOutstanding) },
        ].map((k) => (
          <div key={k.label} className="premium-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold kpi-number">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Reports grid */}
      <section className="premium-panel mt-8 divide-y">
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold">Available Reports</h2>
          <p className="text-sm text-muted-foreground">All files are current as of page load time.</p>
        </div>
        {reports.map((r) => (
          <div key={r.title} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition">
            <span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${r.color}`}>
              <r.icon className="size-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
            basePath="/admin/sales"
            title="Sales Register"
          />
        </Suspense>
      </div>
    </div>
  );
}
