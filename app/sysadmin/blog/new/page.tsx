"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createBlogPostAction } from "@/lib/actions";
import { ImageUpload } from "@/components/image-upload";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [publish, setPublish] = useState(false);
  const [coverImage, setCoverImage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("publish", publish ? "1" : "0");
    fd.set("coverImage", coverImage);
    startTransition(async () => {
      const result = await createBlogPostAction(fd);
      if (result.ok) {
        router.push("/sysadmin/blog");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="dashboard-page">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">System Admin: Blog</p>
          <h1 className="mt-1 text-3xl font-semibold">New Post</h1>
        </div>
        <button type="button" onClick={() => router.push("/sysadmin/blog")} className="rounded border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Post Details</h2>
          <label className="form-label">
            Title *
            <input name="title" required placeholder="e.g. Zimbabwe Property Sector Update" />
          </label>
          <label className="form-label">
            Author
            <input name="authorName" defaultValue="Amata Properties" />
          </label>
          <div className="form-label">
            Cover Image
            <div className="mt-1">
              <ImageUpload value={coverImage} onChange={setCoverImage} aspectRatio="video" />
            </div>
          </div>
          <label className="form-label">
            Excerpt *
            <textarea name="excerpt" required placeholder="A 1–3 sentence summary shown on the news listing page." style={{ minHeight: "5rem" }} />
          </label>
        </div>

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Content</h2>
          <p className="text-sm text-muted-foreground">Write using HTML. Use <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;p&gt;</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;h2&gt;</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;ul&gt;&lt;li&gt;</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;blockquote&gt;</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;strong&gt;</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;em&gt;</code>.</p>
          <textarea name="content" required rows={24} placeholder="<p>Start writing your article here...</p>" className="font-mono text-sm" />
        </div>

        <div className="premium-panel p-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="size-4" />
            <div>
              <p className="text-sm font-semibold">Publish immediately</p>
              <p className="text-xs text-muted-foreground">Uncheck to save as a draft.</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={() => router.push("/sysadmin/blog")} className="rounded border bg-background px-6 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="submit" disabled={isPending} className="rounded bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50">
            {isPending ? "Saving…" : publish ? "Publish Post" : "Save Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
