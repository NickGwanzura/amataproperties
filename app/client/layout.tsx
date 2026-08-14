import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getClientBadges } from "@/lib/db/queries/badges";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const badges = await getClientBadges(user?.id);
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="client" badges={badges} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
