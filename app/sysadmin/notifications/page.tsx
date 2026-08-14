import { SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

async function getNotifications(limit = 100) {
  if (!process.env.DATABASE_URL) return [];
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
}

const channelColor: Record<string, string> = {
  EMAIL: "bg-sky-100 text-sky-700",
  SMS: "bg-emerald-100 text-emerald-700",
  IN_APP: "bg-violet-100 text-violet-700",
};

export default async function SysadminNotificationsPage() {
  const logs = await getNotifications(200);

  const totals = {
    total: logs.length,
    sent: logs.filter((n) => n.sentAt).length,
    pending: logs.filter((n) => !n.sentAt).length,
  };

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="Notifications" title="All email and in-app notification records" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Total Notifications</p>
          <p className="kpi-number mt-1 text-3xl font-semibold">{totals.total}</p>
        </div>
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Delivered</p>
          <p className="kpi-number mt-1 text-3xl font-semibold text-emerald-600">{totals.sent}</p>
        </div>
        <div className="premium-panel p-5 text-center">
          <p className="text-sm text-muted-foreground">Queued / Unsent</p>
          <p className="kpi-number mt-1 text-3xl font-semibold text-amber-600">{totals.pending}</p>
        </div>
      </div>

      <section className="premium-panel mt-8">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Bell className="size-4 text-primary" />
          <h2 className="font-semibold">Notification Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((n) => (
                <tr key={n.id} className="hover:bg-muted/30">
                  <td className="kpi-number whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {n.sentAt
                      ? new Date(n.sentAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${channelColor[n.channel] ?? "bg-muted"}`}>
                      {n.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{n.recipient}</td>
                  <td className="max-w-xs truncate px-4 py-3 font-medium">{n.subject}</td>
                  <td className="px-4 py-3">
                    {n.sentAt
                      ? <span className="text-xs font-semibold text-emerald-600">Delivered</span>
                      : <span className="text-xs font-semibold text-amber-600">Pending</span>}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No notification records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
