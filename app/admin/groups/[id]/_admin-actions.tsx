"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { deactivateGroupAdminAction, inviteGroupAdminAction } from "@/lib/actions";
import { useToast } from "@/components/toast";

export function GroupAdminActions({ groupId, hasAdmin }: { groupId: string; hasAdmin: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await inviteGroupAdminAction(groupId, name, email);
    setPending(false);
    if (result.ok) {
      toast.success("Group administrator invited");
      setShowInvite(false);
      setName("");
      setEmail("");
      router.refresh();
    } else {
      toast.error("Couldn't invite admin", result.error);
    }
  }

  async function deactivate() {
    if (!confirm("Remove this group's administrator? They will lose access to this group.")) return;
    setPending(true);
    const result = await deactivateGroupAdminAction(groupId);
    setPending(false);
    if (result.ok) {
      toast.success("Group administrator removed");
      router.refresh();
    } else {
      toast.error("Couldn't remove admin", result.error);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {!showInvite && (
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold hover:bg-muted"
          >
            <UserPlus className="size-4" /> {hasAdmin ? "Invite Replacement Admin" : "Invite Group Admin"}
          </button>
        )}
        {hasAdmin && (
          <button
            type="button"
            onClick={deactivate}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <UserMinus className="size-4" /> Remove Admin
          </button>
        )}
      </div>

      {showInvite && (
        <form onSubmit={submitInvite} className="mt-3 space-y-3 rounded-lg border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-label">
              Name *
              <input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="form-label">
              Email *
              <input type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="h-10 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Send Invite"}
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="h-10 rounded border px-4 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
