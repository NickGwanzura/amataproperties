import { CheckCircle2, XCircle } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { getSystemHealth } from "@/lib/db/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const checks = await getSystemHealth();
  const passing = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const allGood = passing === total;

  return (
    <div className="dashboard-page">
      <SectionTitle
        eyebrow="Admin: System Health"
        title="Configuration & readiness checklist"
      >
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            allGood
              ? "bg-green-500/10 text-green-600"
              : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {passing}/{total} passing
        </span>
      </SectionTitle>

      <section className="premium-panel mt-8 divide-y">
        {checks.map((check) => (
          <div key={check.name} className="flex items-start gap-4 px-5 py-4">
            <div className="mt-0.5 shrink-0">
              {check.pass ? (
                <CheckCircle2 className="size-5 text-green-500" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{check.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {check.description}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${
                  check.pass ? "text-green-600" : "text-destructive"
                }`}
              >
                {check.detail}
              </p>
            </div>
          </div>
        ))}
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        This page re-runs all checks on every load. Refresh to re-evaluate after making changes.
      </p>
    </div>
  );
}
