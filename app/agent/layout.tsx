import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getAgentBadges } from "@/lib/db/queries/badges";
import { getCurrentAgentProfile } from "@/lib/agent";

export const dynamic = "force-dynamic";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const agent = await getCurrentAgentProfile();
  const badges = await getAgentBadges(agent?.id);
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="agent" badges={badges} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
