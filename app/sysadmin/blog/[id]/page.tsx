"use client";

import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateBlogPostAction } from "@/lib/actions";
import { ImageUpload } from "@/components/image-upload";

type PostData = {
  id: string; title: string; excerpt: string; content: string;
  authorName: string; coverImage: string; published: boolean;
};

async function fetchPost(id: string): Promise<PostData | null> {
  const res = await fetch(`/api/sysadmin/blog/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!loaded) {
    setLoaded(true);
    fetchPost(id).then((p) => { if (p) setPost(p); });
  }

  const set = <K extends keyof PostData>(k: K, v: PostData[K]) => setPost((prev) => prev ? { ...prev, [k]: v } : prev);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setError(""); setSaved(false);
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement);
      fd.set("publish", post.published ? "1" : "0");
      fd.set("coverImage", post.coverImage ?? "");
      const result = await updateBlogPostAction(id, fd);
      if (result.ok) { setSaved(true); } else { setError(result.error); }
    });
  };

  if (!post && !loaded) return <div className="dashboard-page animate-pulse text-muted-foreground">Loading…</div>;
  if (!post) return <div className="dashboard-page text-red-600">Post not found.</div>;

  return (
    <div className="dashboard-page">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">System Admin: Blog</p>
          <h1 className="mt-1 text-3xl font-semibold">Edit Post</h1>
        </div>
        <button type="button" onClick={() => router.push("/sysadmin/blog")} className="rounded border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"><AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}</div>}
        {saved && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="size-4 shrink-0" /> Post updated.</div>}

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Post Details</h2>
          <label className="form-label">Title *<input name="title" required value={post.title} onChange={(e) => set("title", e.target.value)} /></label>
          <label className="form-label">Author<input name="authorName" value={post.authorName} onChange={(e) => set("authorName", e.target.value)} /></label>
          <div className="form-label">
            Cover Image
            <div className="mt-1">
              <ImageUpload value={post.coverImage ?? ""} onChange={(url) => set("coverImage", url)} aspectRatio="video" />
            </div>
          </div>
          <label className="form-label">Excerpt *<textarea name="excerpt" required value={post.excerpt} onChange={(e) => set("excerpt", e.target.value)} style={{ minHeight: "5rem" }} /></label>
        </div>

        <div className="premium-panel space-y-5 p-6">
          <h2 className="font-semibold">Content</h2>
          <textarea name="content" required rows={24} value={post.content} onChange={(e) => set("content", e.target.value)} className="font-mono text-sm" />
        </div>

        <div className="premium-panel p-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={post.published} onChange={(e) => set("published", e.target.checked)} className="size-4" />
            <div>
              <p className="text-sm font-semibold">Published</p>
              <p className="text-xs text-muted-foreground">Uncheck to revert to draft.</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={() => router.push("/sysadmin/blog")} className="rounded border bg-background px-6 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="submit" disabled={isPending} className="rounded bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50">
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
