import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getAccountsBadges } from "@/lib/db/queries/badges";

export const dynamic = "force-dynamic";

export default async function AccountsLayout({ children }: { children: React.ReactNode }) {
  const badges = await getAccountsBadges();
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="accounts" badges={badges} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
