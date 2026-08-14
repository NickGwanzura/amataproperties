"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Trash2, Loader2 } from "lucide-react";
import { updateUserProfile, updateUserRole, deleteUser } from "@/lib/actions";
import { useToast } from "@/components/toast";

const ROLES = ["PUBLIC", "CLIENT", "AGENT", "ACCOUNTS", "ADMINISTRATOR", "CEO"];

const ROLE_COLORS: Record<string, string> = {
  CEO: "bg-primary/10 text-primary border-primary/30",
  SYSTEM_ADMIN: "bg-red-50 text-red-800 border-red-200",
  ADMINISTRATOR: "bg-purple-50 text-purple-800 border-purple-200",
  ACCOUNTS: "bg-indigo-50 text-indigo-800 border-indigo-200",
  AGENT: "bg-amber-50 text-amber-800 border-amber-200",
  CLIENT: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PUBLIC: "bg-muted text-muted-foreground",
};

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  role: string;
  createdAt: Date;
  inviteStatus: "ACTIVE" | "PENDING";
};

export function UserRow({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only used during editing — reset with fresh values on cancel
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);

  function startEditing() {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function saveEdit() {
    const trimmed = editName.trim();
    const emailTrimmed = editEmail.trim().toLowerCase();
    if (!trimmed || !emailTrimmed) return;

    setSaving(true);
    const fd = new FormData();
    fd.set("name", trimmed);
    fd.set("email", emailTrimmed);
    await updateUserProfile(user.id, fd);
    setSaving(false);
    setEditing(false);
    toast.success("Profile updated", `Name and email saved for ${trimmed}.`);
    router.refresh();
  }

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateUserRole(user.id, e.target.value);
    toast.success("Role changed", `${user.name} is now ${e.target.value.replace("_", " ")}.`);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteUser(user.id);
    setDeleting(false);
    toast.success("User deleted", `${user.name} has been removed from the system.`);
    router.refresh();
  }

  return (
    <tr className="border-t group">
      {/* Name / Inline edit */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 w-full rounded border bg-background px-2 text-sm font-semibold outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        ) : (
          <span className="font-semibold">{user.name}</span>
        )}
      </td>

      {/* Email / Inline edit */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            className="h-8 w-full rounded border bg-background px-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          />
        ) : (
          <span className="text-muted-foreground">{user.email}</span>
        )}
      </td>

      {/* Phone */}
      <td className="px-4 py-3 text-muted-foreground">{user.phone ?? "—"}</td>

      {/* Invite Status */}
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

      {/* Role badge */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${ROLE_COLORS[user.role] ?? ""}`}>
          {user.role.replace("_", " ")}
        </span>
      </td>

      {/* Since */}
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </td>

      {/* Change Role */}
      <td className="px-4 py-3">
        <select
          defaultValue={user.role}
          onChange={handleRoleChange}
          className="h-9 rounded border bg-background px-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex size-8 items-center justify-center rounded text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                title="Save"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-muted"
                title="Cancel"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-muted opacity-0 group-hover:opacity-100"
              title="Edit name & email"
            >
              <Pencil className="size-4" />
            </button>
          )}

          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex size-8 items-center justify-center rounded text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                title="Confirm delete"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="inline-flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-muted"
                title="Cancel delete"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
              title="Delete user"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
