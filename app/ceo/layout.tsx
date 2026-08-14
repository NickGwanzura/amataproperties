import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getCeoBadges } from "@/lib/db/queries/badges";

export const dynamic = "force-dynamic";

export default async function CeoLayout({ children }: { children: React.ReactNode }) {
  const badges = await getCeoBadges();
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="ceo" badges={badges} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
