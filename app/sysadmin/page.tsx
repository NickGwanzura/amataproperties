import Link from "next/link";
import {
  Activity, Building2, CreditCard, Handshake, Shield, TrendingUp, UserPlus, Users,
} from "lucide-react";
import { DashboardAlerts } from "@/components/dashboard-alerts";
import { SectionTitle, StatCard, StatusBadge } from "@/components/ui";
import { getExecutiveStats, getMonthlyRevenue, getAgentRankings } from "@/lib/db/queries/admin";
import { getAllUsers } from "@/lib/db/queries/admin";
import { getAuditLogs } from "@/lib/db/queries/audit";
import { getDataIntegrityIssues } from "@/lib/db/queries/data-integrity";
import { getRecentActiveReservations } from "@/lib/db/queries/reservations";
import { RevenueChart } from "@/components/charts";
import { money, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

const quickLinks = [
  { label: "Sales Register",   href: "/sysadmin/sales",         icon: TrendingUp, desc: "All sales across developments" },
  { label: "All Clients",      href: "/sysadmin/clients",       icon: Users,     desc: "Client records & payment history" },
  { label: "Users & Roles",    href: "/sysadmin/users",         icon: UserPlus,  desc: "Manage all accounts" },
  { label: "Audit Trail",      href: "/sysadmin/audit",         icon: Shield,    desc: "Full action log" },
];

export default async function SysadminPage() {
  const [stats, users, auditLogs, rankings, monthly, activePresales, integrityIssues] = await Promise.all([
    getExecutiveStats(),
    getAllUsers(),
    getAuditLogs(10),
    getAgentRankings(),
    getMonthlyRevenue(),
    getRecentActiveReservations(20),
    getDataIntegrityIssues(),
  ]);

  const chartData = monthly.map((r) => ({
    month: r.month,
    revenue: parseFloat(r.revenue),
    collections: parseFloat(r.collections),
  }));

  const roleBreakdown = [
    "SYSTEM_ADMIN", "ADMINISTRATOR", "CEO", "ACCOUNTS", "AGENT", "CLIENT", "PUBLIC",
  ].map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
  }));
  const highIntegrityIssues = integrityIssues.filter((issue) => issue.severity === "high").length;
  const expiringPresales = activePresales.filter((reservation) =>
    reservation.expiresAt && new Date(reservation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
  ).length;
  const sysadminAlerts = [
    ...(integrityIssues.length > 0 ? [{
      title: `${integrityIssues.length} data quality checks need attention`,
      detail: `${highIntegrityIssues} high severity issues across sales, stands, KYC, logins, images, and balances.`,
      href: "/sysadmin/data-integrity",
      label: "Audit",
      tone: highIntegrityIssues > 0 ? "danger" as const : "warning" as const,
    }] : []),
    ...(expiringPresales > 0 ? [{
      title: `${expiringPresales} presales expire within 24 hours`,
      detail: "Confirm deposit follow-up or release the stand before availability becomes misleading.",
      href: "/admin/reservations",
      label: "Reservations",
      tone: "warning" as const,
    }] : []),
  ];

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="System Admin" title="Platform overview: full visibility across all modules" />

      <DashboardAlerts alerts={sysadminAlerts} className="mt-6" />

      {/* KPI grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users"           value={String(users.length)}               detail={`${users.filter((u) => u.role === "CLIENT").length} clients`} />
        <StatCard label="Developments"          value={String(stats.developments)} />
        <StatCard label="Total Stands"          value={String(stats.totalStands)}          detail={`${stats.available} available · ${stats.sold} sold`} />
        <StatCard label="Total Revenue"         value={money(stats.revenue)}               detail={`${percent(stats.collectionEfficiency)} collected`} />
        <StatCard label="Outstanding Balance"   value={money(stats.outstanding)} />
        <StatCard label="Commission Liability"  value={money(stats.commissionLiability)} />
        <StatCard label="Total Sales"             value={String(stats.sold)} />
        <StatCard label="Deposits Collected"    value={money(stats.depositsCollected)} />
      </div>

      {/* Active Presales */}
      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Handshake className="size-5 text-primary" />
            Active Presales &amp; Reservations
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {activePresales.length}
            </span>
          </h2>
          <Link href="/admin/reservations" className="text-sm font-semibold text-primary hover:underline">
            Manage all →
          </Link>
        </div>
        {activePresales.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No active presales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Development</th>
                  <th className="px-4 py-3">Stand</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expires</th>
                </tr>
              </thead>
              <tbody>
                {activePresales.map((r) => {
                  const isExpiringSoon = r.expiresAt && new Date(r.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="kpi-number px-4 py-3 font-semibold">{r.reference}</td>
                      <td className="px-4 py-3 font-medium">{r.client.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.development.name}</td>
                      <td className="kpi-number px-4 py-3 font-semibold">{r.stand.standNumber}</td>
                      <td className="kpi-number px-4 py-3">{money(parseFloat(r.stand.price))}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.agent?.user?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status.replace(/_/g, " ")} />
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${isExpiringSoon ? "text-red-600" : "text-muted-foreground"}`}>
                        {r.expiresAt
                          ? new Date(r.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick nav */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((ql) => (
          <Link
            key={ql.href}
            href={ql.href}
            className="premium-panel flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ql.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{ql.label}</p>
              <p className="truncate text-sm text-muted-foreground">{ql.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Revenue chart */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <TrendingUp className="size-5 text-primary" />
              Revenue vs Collections
            </h2>
            <Link href="/ceo/revenue" className="text-sm font-semibold text-primary">Full report →</Link>
          </div>
          <RevenueChart data={chartData.length > 0 ? chartData : undefined} />
        </div>

        {/* User role breakdown */}
        <div className="premium-panel">
          <div className="flex items-center gap-2 border-b p-4">
            <Users className="size-5 text-primary" />
            <h2 className="font-semibold">Users by Role</h2>
          </div>
          {roleBreakdown.map(({ role, count }) => (
            <div key={role} className="flex items-center justify-between border-b p-4 last:border-b-0">
              <span className="text-sm font-medium text-muted-foreground">{role.replace("_", " ")}</span>
              <span className="kpi-number font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent audit log */}
        <section className="premium-panel">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <Shield className="size-4 text-primary" /> Recent Activity
            </h2>
            <Link href="/sysadmin/audit" className="text-sm font-semibold text-primary">View all →</Link>
          </div>
          <div className="divide-y">
            {auditLogs.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">No audit entries yet.</p>
            )}
            {auditLogs.map((log) => (
              <div key={log.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{log.action.replaceAll("_", " ")}</p>
                    <p className="text-[12px] text-muted-foreground">{log.module} · {log.user?.name ?? "System"}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent rankings */}
        <section className="premium-panel">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <Activity className="size-4 text-primary" /> Top Agents
            </h2>
            <Link href="/ceo/agents" className="text-sm font-semibold text-primary">Full table →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rankings.filter(Boolean).slice(0, 5).map((agent, i) => (
                  <tr key={agent!.name} className="border-t">
                    <td className="kpi-number px-4 py-3 font-semibold text-muted-foreground">#{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{agent!.name}</td>
                    <td className="kpi-number px-4 py-3">{agent!.sales}</td>
                    <td className="kpi-number px-4 py-3 font-semibold">{money(agent!.revenue)}</td>
                  </tr>
                ))}
                {rankings.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No sales data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Cross-dashboard shortcuts */}
      <section className="mt-8 premium-panel">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Cross-Dashboard Access</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Direct links to every module in the platform</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: "/admin",    label: "Admin ERP",       icon: Building2,  color: "text-violet-600" },
            { href: "/ceo",      label: "CEO Dashboard",   icon: TrendingUp, color: "text-primary" },
            { href: "/accounts", label: "Accounts",        icon: CreditCard, color: "text-amber-600" },
            { href: "/agent",    label: "Agent CRM",       icon: Users,      color: "text-emerald-600" },
            { href: "/client",   label: "Client Portal",   icon: Activity,   color: "text-sky-600" },
            { href: "/admin/audit", label: "Admin Audit",  icon: Shield,     color: "text-red-600" },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 px-4 py-5 text-center transition hover:bg-muted/50"
            >
              <Icon className={`size-6 ${color}`} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
