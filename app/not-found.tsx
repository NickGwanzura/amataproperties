import { ArrowRight } from "lucide-react";
import { ButtonLink, GhostLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Error 404</p>
      <h1 className="mt-4 text-4xl font-semibold leading-[1] tracking-[-0.04em] sm:text-6xl">This page has moved on.</h1>
      <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
        The page you are looking for doesn&apos;t exist or has been moved. These are good places to pick things up again.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/developments" className="rounded-full px-6">
          Explore developments <ArrowRight className="ml-2 size-4" />
        </ButtonLink>
        <GhostLink href="/contact" className="rounded-full px-6">
          Contact Amata
        </GhostLink>
        <GhostLink href="/" className="rounded-full border-transparent px-6 text-muted-foreground hover:text-foreground">
          Back to home
        </GhostLink>
      </div>
    </main>
  );
}
