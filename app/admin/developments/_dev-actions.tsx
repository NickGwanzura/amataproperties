"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, Copy, Loader2, Trash2 } from "lucide-react";
import { archiveDevelopmentAction, restoreDevelopmentAction, softDeleteDevelopmentAction, duplicateDevelopmentAction } from "@/lib/actions";
import { useToast } from "@/components/toast";

type Result = { ok: true; slug?: string } | { ok: false; error: string };

function useResultAction(fn: (id: string) => Promise<Result>, successMsg: string) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function run(id: string) {
    setPending(true);
    try {
      const result = await fn(id);
      if (result.ok) {
        toast.success(successMsg);
      } else {
        toast.error("Couldn't complete this action", result.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return { run, pending };
}

export function DevArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  const archive = useResultAction(archiveDevelopmentAction, "Development archived");
  const restore = useResultAction(restoreDevelopmentAction, "Development restored");
  const { run, pending } = archived ? restore : archive;

  return (
    <button
      type="button"
      onClick={() => run(id)}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
      {archived ? "Restore" : "Archive"}
    </button>
  );
}

export function DevRestoreButton({ id }: { id: string }) {
  const { run, pending } = useResultAction(restoreDevelopmentAction, "Development restored");
  return (
    <button
      type="button"
      onClick={() => run(id)}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <ArchiveRestore className="size-3.5" />}
      Restore
    </button>
  );
}

export function DevDeleteButton({ id }: { id: string }) {
  const { run, pending } = useResultAction(softDeleteDevelopmentAction, "Development deleted");
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Delete this development? This is only allowed when no stands are sold/reserved and no sale is active.")) run(id);
      }}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Delete
    </button>
  );
}

export function DevDuplicateButton({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const result = await duplicateDevelopmentAction(id);
      if (result.ok) {
        toast.success("Development duplicated", "Stands were not copied — the new development is a shell you can configure.");
        router.refresh();
      } else {
        toast.error("Couldn't duplicate", result.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
      Duplicate
    </button>
  );
}
