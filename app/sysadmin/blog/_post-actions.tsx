"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toggleBlogPostPublishedAction, deleteBlogPostAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function PostActions({ id, published }: { id: string; published: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      await toggleBlogPostPublishedAction(id);
      router.refresh();
    });
  }

  function del() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteBlogPostAction(id);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
      >
        {published ? <><EyeOff className="size-3" /> Unpublish</> : <><Eye className="size-3" /> Publish</>}
      </button>
      <button
        type="button"
        onClick={del}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="size-3" /> Delete
      </button>
    </>
  );
}
