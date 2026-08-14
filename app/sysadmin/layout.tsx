import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getSysadminBadges } from "@/lib/db/queries/badges";

export const dynamic = "force-dynamic";

export default async function SysadminLayout({ children }: { children: React.ReactNode }) {
  const badges = await getSysadminBadges();
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="sysadmin" badges={badges} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
