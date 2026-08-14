import Link from "next/link";
import { PlusCircle, Pencil, ExternalLink } from "lucide-react";
import { db } from "@/lib/db/index";
import { blogPosts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { SectionTitle } from "@/components/ui";
import { PostActions } from "./_post-actions";

export const dynamic = "force-dynamic";

export default async function SysadminBlogPage() {
  const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));

  return (
    <div className="dashboard-page">
      <div className="flex items-start justify-between mb-6">
        <SectionTitle eyebrow="System Admin" title="Blog & News" />
        <Link
          href="/sysadmin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px"
        >
          <PlusCircle className="size-4" /> New Post
        </Link>
      </div>

      <div className="premium-panel overflow-hidden">
        <div className="border-b px-5 py-4">
          <p className="text-sm text-muted-foreground">{posts.length} post{posts.length === 1 ? "" : "s"}</p>
        </div>
        {posts.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">No posts yet.</div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{post.title}</p>
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${post.published ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {post.authorName} · {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {post.published && (
                    <Link href={`/news/${post.slug}`} target="_blank" className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold hover:bg-muted">
                      <ExternalLink className="size-3" /> View
                    </Link>
                  )}
                  <Link href={`/sysadmin/blog/${post.id}`} className="inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-semibold hover:bg-muted">
                    <Pencil className="size-3" /> Edit
                  </Link>
                  <PostActions id={post.id} published={post.published} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
