import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getAdminBadges } from "@/lib/db/queries/badges";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const badges = await getAdminBadges();
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="admin" badges={badges} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
