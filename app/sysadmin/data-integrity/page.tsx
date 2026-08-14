import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getDataIntegrityIssues } from "@/lib/db/queries/data-integrity";

export const dynamic = "force-dynamic";

const severityStyles: Record<string, string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
};

export default async function DataIntegrityPage() {
  const issues = await getDataIntegrityIssues();
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Sysadmin: Data Integrity"
        title="Automated checks for inconsistent business data"
      >
        Flags stands, sales, and reservations that don&apos;t line up with each other —
        e.g. a stand still marked RESERVED after its presale expired, or a stand priced
        below the development&apos;s current rate.
      </SectionTitle>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Total Issues</p>
          <p className="mt-2 text-3xl font-semibold kpi-number">{issues.length}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">High Severity</p>
          <p className="mt-2 text-3xl font-semibold kpi-number text-red-700">{highCount}</p>
        </div>
        <div className="premium-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Medium Severity</p>
          <p className="mt-2 text-3xl font-semibold kpi-number text-amber-700">{mediumCount}</p>
        </div>
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">Flagged Issues</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Checks run live on every page load — nothing here is cached.
          </p>
        </div>

        {issues.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="font-semibold">No issues found</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Stands, sales, and reservations are all internally consistent right now.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <AlertTriangle className={`mt-0.5 size-5 shrink-0 ${issue.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${severityStyles[issue.severity]}`}>
                      {issue.category}
                    </span>
                  </div>
                  <p className="mt-1.5 font-semibold">{issue.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{issue.detail}</p>
                  {issue.href && (
                    <Link href={issue.href} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                      Go fix this →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
