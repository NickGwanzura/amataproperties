export const dynamic = "force-dynamic";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";

export default async function SysadminReportsPage() {
  const [users, auditCount, salesCount] = await Promise.all([
    db.query.users.findMany({ columns: { id: true, role: true } }),
    db.query.auditLogs.findMany({ columns: { id: true } }).then((r) => r.length),
    db.query.sales.findMany({ columns: { id: true } }).then((r) => r.length),
  ]);

  const byRole = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const reports = [
    {
      title: "User Directory",
      description: `${users.length} users · ${byRole["AGENT"] ?? 0} agents, ${byRole["CLIENT"] ?? 0} clients`,
      href: "/api/reports/users/csv",
      xlsxHref: "/api/reports/users/xlsx",
      icon: FileSpreadsheet,
      color: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      title: "Audit Log Export",
      description: `${auditCount.toLocaleString()} events · last 5,000 exported`,
      href: "/api/reports/audit/csv",
      xlsxHref: "/api/reports/audit/xlsx",
      icon: FileText,
      color: "text-slate-700 bg-slate-50 border-slate-200",
    },
    {
      title: "Sales Register",
      description: `${salesCount} sales on record`,
      href: "/api/reports/sales/csv",
      xlsxHref: "/api/reports/sales/xlsx",
      icon: FileSpreadsheet,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
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
      title: "Stand Inventory",
      description: "All stands across every development",
      href: "/api/reports/stands/csv",
      xlsxHref: "/api/reports/stands/xlsx",
      icon: FileSpreadsheet,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "Reservations",
      description: "Full reservations register with status",
      href: "/api/reports/reservations/csv",
      xlsxHref: "/api/reports/reservations/xlsx",
      icon: FileSpreadsheet,
      color: "text-violet-700 bg-violet-50 border-violet-200",
    },
    {
      title: "Agent Performance",
      description: "Revenue and commissions per agent",
      href: "/api/reports/agents/csv",
      xlsxHref: "/api/reports/agents/xlsx",
      icon: FileSpreadsheet,
      color: "text-primary bg-primary/5 border-primary/20",
    },
    {
      title: "Installment Revenue",
      description: "Monthly collections by development",
      href: "/api/reports/installment-revenue/csv",
      xlsxHref: "/api/reports/installment-revenue/xlsx",
      icon: FileSpreadsheet,
      color: "text-rose-700 bg-rose-50 border-rose-200",
    },
    {
      title: "CEO Executive Report",
      description: "Sales, stands, monthly installments & collections — full executive overview",
      href: "/api/reports/ceo-report/pdf",
      format: "PDF",
      icon: FileText,
      color: "text-amber-700 bg-amber-50 border-amber-300",
      openInTab: true,
    },
  ];

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Sysadmin: Reports" title="Full platform data exports">
        Access all system data as structured CSV exports. Suitable for compliance
        audits, data migrations, and executive reporting.
      </SectionTitle>

      {/* Role breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(byRole)
          .sort((a, b) => b[1] - a[1])
          .map(([role, count]) => (
            <div key={role} className="premium-panel p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{role.replace("_", " ")}</p>
              <p className="mt-1 text-2xl font-semibold kpi-number">{count}</p>
            </div>
          ))}
      </div>

      {/* Reports */}
      <section className="premium-panel mt-8 divide-y">
        <div className="px-5 py-4">
          <h2 className="text-lg font-semibold">Available Reports</h2>
          <p className="text-sm text-muted-foreground">All exports are generated live from the production database.</p>
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
                    {...("openInTab" in r && r.openInTab ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
                  >
                    <Download className="size-3.5" />
                    {"openInTab" in r && r.openInTab ? "Open PDF" : "Download"}
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
