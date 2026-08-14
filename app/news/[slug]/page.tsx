import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db/index";
import { blogPosts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));

  if (!post) return {};

  const ogImage = post.coverImage?.startsWith("http")
    ? { url: post.coverImage, width: 1200, height: 630, alt: post.title }
    : { url: "/opengraph-image", width: 1200, height: 630, alt: "Amata Properties" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      url: `/news/${post.slug}`,
      title: `${post.title} | Amata`,
      description: post.excerpt,
      images: [ogImage],
      ...(post.publishedAt && { publishedTime: post.publishedAt.toISOString() }),
      authors: [post.authorName],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Amata`,
      description: post.excerpt,
      images: [ogImage.url],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)));

  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/news" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to News
      </Link>

      {post.coverImage ? (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="mb-8 aspect-[16/9] rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span className="text-6xl font-semibold text-primary/20">SP</span>
        </div>
      )}

      <div className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-primary">News & Updates</div>
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{post.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-b pb-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="size-4" /> {post.authorName}
        </span>
        {post.publishedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
      </div>

      <div
        className="prose prose-neutral mt-8 max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
          prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-foreground/90
          prose-li:text-[15px] prose-li:text-foreground/90
          prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
          prose-strong:font-semibold prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );
}
