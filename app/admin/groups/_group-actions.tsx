"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, CheckCircle2, Loader2 } from "lucide-react";
import { archiveGroupAction, publishGroupAction } from "@/lib/actions";
import { useToast } from "@/components/toast";

function useResultAction(fn: (id: string) => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function run(id: string) {
    setPending(true);
    try {
      const result = await fn(id);
      if (result.ok) toast.success(successMsg);
      else toast.error("Couldn't complete this action", result.error);
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return { run, pending };
}

export function GroupPublishButton({ id }: { id: string }) {
  const { run, pending } = useResultAction(publishGroupAction, "Group published");
  return (
    <button type="button" onClick={() => run(id)} disabled={pending} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-50">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Publish
    </button>
  );
}

export function GroupArchiveButton({ id }: { id: string }) {
  const { run, pending } = useResultAction(archiveGroupAction, "Group archived");
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Archive this group? Members and their sales are unaffected.")) run(id);
      }}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Archive className="size-3.5" />} Archive
    </button>
  );
}
