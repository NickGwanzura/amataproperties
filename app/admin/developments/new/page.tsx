import { CreateDevelopmentForm } from "./_form";

export default function NewDevelopmentPage() {
  return (
    <div className="dashboard-page">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">Admin: Developments</p>
        <h1 className="mt-1 text-3xl font-semibold">New Development Onboarding</h1>
        <p className="mt-2 text-muted-foreground">Complete all four steps to onboard a new estate and optionally create stands in bulk.</p>
      </div>
      <CreateDevelopmentForm />
    </div>
  );
}
