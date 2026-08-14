import { DashboardSidebar } from "@/components/dashboard-sidebar";

export const dynamic = "force-dynamic";

export default async function GroupAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <DashboardSidebar dashboard="groupAdmin" />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
    </div>
  );
}
