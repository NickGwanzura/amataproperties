import { SectionTitle } from "@/components/ui";
import { getAllUsers, updateUserRole } from "@/lib/db/queries/admin";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/lib/auth-token";
import { CreateUserForm } from "@/app/admin/users/_form";
import { DeleteUserButton } from "./_delete-button";

export const dynamic = "force-dynamic";

const ROLES: UserRole[] = [
  "SYSTEM_ADMIN", "ADMINISTRATOR", "CEO", "ACCOUNTS", "AGENT", "GROUP_ADMIN", "CLIENT", "PUBLIC",
];

const roleColor: Record<UserRole, string> = {
  SYSTEM_ADMIN: "bg-red-100 text-red-700",
  ADMINISTRATOR: "bg-violet-100 text-violet-700",
  CEO: "bg-primary/10 text-primary",
  ACCOUNTS: "bg-amber-100 text-amber-700",
  AGENT: "bg-emerald-100 text-emerald-700",
  GROUP_ADMIN: "bg-indigo-100 text-indigo-700",
  CLIENT: "bg-sky-100 text-sky-700",
  PUBLIC: "bg-muted text-muted-foreground",
};

async function changeRole(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as UserRole;
  if (userId && role) await updateUserRole(userId, role);
  revalidatePath("/sysadmin/users");
}

export default async function SysadminUsersPage() {
  const users = await getAllUsers();

  const byRole = ROLES.map((role) => ({
    role,
    users: users.filter((u) => u.role === role),
  }));

  return (
    <main className="dashboard-page">
      <SectionTitle eyebrow="Users &amp; Roles" title="All platform users and their access levels" />

      <div className="mt-6">
        <CreateUserForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {byRole.map(({ role, users: ru }) => (
          <div key={role} className="premium-panel p-4 text-center">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[role]}`}>
              {role.replace("_", " ")}
            </span>
            <p className="kpi-number mt-2 text-3xl font-semibold">{ru.length}</p>
          </div>
        ))}
      </div>

      <section className="premium-panel mt-8">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">User Registry</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{users.length} total accounts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Change Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 group">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.inviteStatus === "PENDING" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold leading-none text-amber-800">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Invite Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold leading-none text-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[user.role as UserRole] ?? ""}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <form action={changeRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="h-8 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.replace("_", " ")}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="h-8 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <DeleteUserButton userId={user.id} userName={user.name} userEmail={user.email} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No users found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
