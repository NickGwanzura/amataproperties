import { getAllDevelopments } from "@/lib/db/queries/developments";
import { CreateGroupForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const developments = await getAllDevelopments();
  const devOptions = developments.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="dashboard-page">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">Admin: Group Buying</p>
        <h1 className="mt-1 text-3xl font-semibold">New Group Onboarding</h1>
        <p className="mt-2 text-muted-foreground">Set up a group, assign stands, import members, and invite an administrator.</p>
      </div>
      <CreateGroupForm developments={devOptions} />
    </div>
  );
}
