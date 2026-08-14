import { GhostLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-6xl font-semibold text-primary">404</h1>
      <p className="mt-4 text-xl font-semibold">Page not found</p>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <GhostLink href="/" className="mt-8">
        Back to Home
      </GhostLink>
    </main>
  );
}
