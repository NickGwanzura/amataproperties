import { SectionTitle } from "@/components/ui";
import { getAllUsers } from "@/lib/db/queries/admin";
import { CreateUserForm } from "./_form";
import { UserRow } from "./_user-row";

export const dynamic = "force-dynamic";

// Admin sees all roles except SYSTEM_ADMIN
const ROLES = ["PUBLIC", "CLIENT", "AGENT", "ACCOUNTS", "ADMINISTRATOR", "CEO"];

export default async function AdminUsersPage() {
  const allUsers = await getAllUsers();
  const users = allUsers.filter((u) => u.role !== "SYSTEM_ADMIN");

  const byRole = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Admin: Users" title="User accounts, roles, and access" />

      {/* Create user */}
      <div className="mt-6">
        <CreateUserForm />
      </div>

      {/* Role counts */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {ROLES.map((r) => (
          <div key={r} className="premium-panel p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{r.replace("_", " ")}</p>
            <p className="kpi-number mt-1.5 text-2xl font-semibold">{byRole[r] ?? 0}</p>
          </div>
        ))}
      </div>

      <section className="premium-panel mt-8">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold">User Registry</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{users.length} total accounts</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Since</th>
                <th className="px-4 py-3">Change Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
