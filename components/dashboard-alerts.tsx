import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardAlertTone = "danger" | "warning" | "info" | "success";

export type DashboardAlert = {
  title: string;
  detail: string;
  href?: string;
  label?: string;
  tone?: DashboardAlertTone;
};

const toneStyles: Record<DashboardAlertTone, { shell: string; icon: string; Icon: LucideIcon }> = {
  danger: { shell: "border-red-200 bg-red-50 text-red-950", icon: "text-red-600", Icon: AlertTriangle },
  warning: { shell: "border-amber-200 bg-amber-50 text-amber-950", icon: "text-amber-600", Icon: AlertTriangle },
  info: { shell: "border-sky-200 bg-sky-50 text-sky-950", icon: "text-sky-600", Icon: Info },
  success: { shell: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: "text-emerald-600", Icon: CheckCircle2 },
};

export function DashboardAlerts({ alerts, className }: { alerts: DashboardAlert[]; className?: string }) {
  if (alerts.length === 0) return null;

  return (
    <section className={cn("grid gap-3", className)} aria-label="Dashboard alerts">
      {alerts.map((alert) => {
        const tone = toneStyles[alert.tone ?? "info"];
        const Icon = tone.Icon;
        const body = (
          <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", tone.shell)}>
            <Icon className={cn("mt-0.5 size-4 shrink-0", tone.icon)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5">{alert.title}</p>
              <p className="mt-0.5 text-xs leading-5 opacity-80">{alert.detail}</p>
            </div>
            {alert.href ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
                {alert.label ?? "Open"}
                <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            ) : null}
          </div>
        );

        return alert.href ? (
          <Link key={alert.title + alert.href} href={alert.href} className="block transition hover:-translate-y-0.5 hover:shadow-sm">
            {body}
          </Link>
        ) : (
          <div key={alert.title}>{body}</div>
        );
      })}
    </section>
  );
}
