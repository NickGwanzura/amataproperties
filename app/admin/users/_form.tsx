"use client";

import { useActionState, useState } from "react";
import { Plus, X, Loader2, CheckCircle2, Mail } from "lucide-react";
import { createUserAccount, inviteUserAction } from "@/lib/actions";

// Admin creates/invites all roles except SYSTEM_ADMIN
const ROLES = ["PUBLIC", "CLIENT", "AGENT", "ACCOUNTS", "ADMINISTRATOR", "CEO", "GROUP_ADMIN"];

function CreateUserFormInner({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState<
    { ok: true } | { ok: false; error: string } | null,
    FormData
  >(createUserAccount, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-emerald-50 py-10 text-emerald-800">
        <CheckCircle2 className="size-10" />
        <p className="text-lg font-semibold">User Created</p>
        <p className="text-sm">The account has been added and can log in immediately.</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 inline-flex h-9 items-center rounded border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="create-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="create-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Tanaka Moyo"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="create-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="create-email"
          name="email"
          type="email"
          required
          placeholder="tanaka@example.com"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="create-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="create-role"
          name="role"
          defaultValue="AGENT"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="create-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phone Number
        </label>
        <input
          id="create-phone"
          name="phone"
          type="text"
          placeholder="e.g. +263 71 234 5678"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="create-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="create-password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {state?.ok === false && (
        <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          {state.error}
        </div>
      )}

      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {pending ? "Creating…" : "Create Account"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-11 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          <X className="size-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function InviteUserFormInner({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState<
    { ok: true } | { ok: false; error: string } | null,
    FormData
  >(inviteUserAction, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-emerald-50 py-10 text-emerald-800">
        <CheckCircle2 className="size-10" />
        <p className="text-lg font-semibold">Invitation Sent</p>
        <p className="text-sm text-center max-w-xs">The user will receive an email with a link to set their password and activate their account.</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-2 inline-flex h-9 items-center rounded border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        The user will receive an email with a secure link to set their own password. The link expires in 7 days.
      </div>

      <div>
        <label htmlFor="invite-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="invite-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Tanaka Moyo"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="invite-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="tanaka@example.com"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="invite-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="AGENT"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="invite-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Phone Number
        </label>
        <input
          id="invite-phone"
          name="phone"
          type="text"
          placeholder="e.g. +263 71 234 5678"
          className="h-10 w-full rounded border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {state?.ok === false && (
        <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          {state.error}
        </div>
      )}

      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          {pending ? "Sending…" : "Send Invite"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-11 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
        >
          <X className="size-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CreateUserForm() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"create" | "invite">("invite");
  const [formKey, setFormKey] = useState(0);

  function handleToggle() {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      setFormKey((k) => k + 1);
    }
  }

  function handleTabChange(next: "create" | "invite") {
    setTab(next);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="premium-panel">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/30"
      >
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Plus className="size-5 text-primary" />
            Add User
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create an account or send an invite link
          </p>
        </div>
        <span className={`transition ${open ? "rotate-45" : ""}`}>
          <Plus className="size-5 text-muted-foreground" />
        </span>
      </button>

      {open && (
        <div className="border-t" key={formKey}>
          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => handleTabChange("invite")}
              className={`flex-1 px-5 py-3 text-sm font-semibold transition border-b-2 ${
                tab === "invite"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="mr-1.5 inline size-4" />
              Invite by Email
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("create")}
              className={`flex-1 px-5 py-3 text-sm font-semibold transition border-b-2 ${
                tab === "create"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="mr-1.5 inline size-4" />
              Create with Password
            </button>
          </div>

          <div className="px-5 py-5">
            {tab === "invite" ? (
              <InviteUserFormInner onDone={() => setOpen(false)} />
            ) : (
              <CreateUserFormInner onDone={() => setOpen(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
