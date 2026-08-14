import { SectionTitle } from "@/components/ui";
import { MarketingImageSettings } from "@/components/marketing-image-settings";
import { CheckCircle2, Server, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function EnvRow({ label, value, sensitive = false }: { label: string; value: string | undefined; sensitive?: boolean }) {
  const isSet = Boolean(value);
  return (
    <div className="flex items-center justify-between border-b px-5 py-4 last:border-b-0">
      <div>
        <p className="font-semibold">{label}</p>
        {isSet && !sensitive && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{value}</p>
        )}
        {isSet && sensitive && (
          <p className="mt-0.5 text-xs text-muted-foreground">••••••••••••••••</p>
        )}
      </div>
      {isSet ? (
        <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="size-5 shrink-0 text-red-400" />
      )}
    </div>
  );
}

export default function SysadminSettingsPage() {
  const envGroups = [
    {
      title: "Database",
      items: [
        { label: "DATABASE_URL", value: process.env.DATABASE_URL, sensitive: true },
      ],
    },
    {
      title: "Railway Tigris Storage",
      items: [
        { label: "S3_ENDPOINT", value: process.env.S3_ENDPOINT },
        { label: "S3_BUCKET_NAME", value: process.env.S3_BUCKET_NAME },
        { label: "S3_ACCESS_KEY_ID", value: process.env.S3_ACCESS_KEY_ID, sensitive: true },
        { label: "S3_SECRET_ACCESS_KEY", value: process.env.S3_SECRET_ACCESS_KEY, sensitive: true },
        { label: "S3_PUBLIC_URL", value: process.env.S3_PUBLIC_URL },
      ],
    },
    {
      title: "Email (Resend)",
      items: [
        { label: "RESEND_API_KEY", value: process.env.RESEND_API_KEY, sensitive: true },
      ],
    },
    {
      title: "Cron / Automation",
      items: [
        { label: "CRON_SECRET", value: process.env.CRON_SECRET, sensitive: true },
      ],
    },
    {
      title: "Auth / Security",
      items: [
        { label: "AUTH_SECRET", value: process.env.AUTH_SECRET, sensitive: true },
      ],
    },
    {
      title: "Application",
      items: [
        { label: "NEXT_PUBLIC_APP_URL", value: process.env.NEXT_PUBLIC_APP_URL },
        { label: "NODE_ENV", value: process.env.NODE_ENV },
      ],
    },
  ];

  const allEnvs = envGroups.flatMap((g) => g.items);
  const configured = allEnvs.filter((e) => Boolean(e.value)).length;
  const total = allEnvs.length;

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="System Settings" title="Environment configuration and platform status" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Environment Variables</p>
          <p className="kpi-number mt-1 text-3xl font-semibold">{configured}/{total}</p>
          <p className="mt-1 text-xs text-muted-foreground">configured</p>
        </div>
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Database</p>
          <p className={`mt-1 text-sm font-semibold ${process.env.DATABASE_URL ? "text-emerald-600" : "text-red-500"}`}>
            {process.env.DATABASE_URL ? "Connected (Neon)" : "Not configured"}
          </p>
        </div>
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Storage</p>
          <p className={`mt-1 text-sm font-semibold ${process.env.S3_ENDPOINT ? "text-emerald-600" : "text-amber-500"}`}>
            {process.env.S3_ENDPOINT ? "Tigris Ready" : "Storage not configured"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MarketingImageSettings />
        </div>

        {envGroups.map((group) => (
          <section key={group.title} className="premium-panel">
            <div className="flex items-center gap-2 border-b px-5 py-4">
              <Server className="size-4 text-primary" />
              <h2 className="font-semibold">{group.title}</h2>
            </div>
            {group.items.map((item) => (
              <EnvRow key={item.label} label={item.label} value={item.value} sensitive={item.sensitive} />
            ))}
          </section>
        ))}
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Cron Endpoints</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Configure these in Vercel Cron or Upstash</p>
        </div>
        <div className="divide-y">
          {[
            {
              path: "/api/cron/expire-reservations",
              schedule: "*/15 * * * *",
              desc: "Expires pending reservations older than 24h and releases stands",
            },
            {
              path: "/api/cron/installment-reminders",
              schedule: "0 8 * * *",
              desc: "Sends installment due/overdue email reminders to clients, agents, and admin",
            },
          ].map((cron) => (
            <div key={cron.path} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{cron.path}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{cron.desc}</p>
                </div>
                <span className="rounded bg-muted px-3 py-1 font-mono text-xs">{cron.schedule}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
