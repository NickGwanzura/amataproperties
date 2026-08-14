"use client";

import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteUser } from "@/lib/actions";
import { useToast } from "@/components/toast";
import { useState } from "react";

export function DeleteUserButton({ userId, userName, userEmail }: { userId: string; userName: string; userEmail: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete user "${userName}" (${userEmail})? This cannot be undone.`)) return;
    setPending(true);
    await deleteUser(userId);
    setPending(false);
    toast.success("User deleted", `${userName} has been removed from the system.`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex size-8 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
      title="Delete user"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
