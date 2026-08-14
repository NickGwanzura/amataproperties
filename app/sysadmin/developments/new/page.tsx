import { CreateDevelopmentForm } from "@/app/admin/developments/new/_form";

export default function SysadminNewDevelopmentPage() {
  return (
    <div className="dashboard-page">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">System Admin: Developments</p>
        <h1 className="mt-1 text-3xl font-semibold">New Development Onboarding</h1>
        <p className="mt-2 text-muted-foreground">Complete all four steps to onboard a new estate and optionally create stands in bulk.</p>
      </div>
      <CreateDevelopmentForm redirectTo="/sysadmin/developments" />
    </div>
  );
}
