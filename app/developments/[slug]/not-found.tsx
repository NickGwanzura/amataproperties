import { GhostLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-3xl font-semibold">Development not found</h1>
      <p className="mt-3 text-muted-foreground">The requested development is not currently available.</p>
      <GhostLink href="/" className="mt-6">Back to developments</GhostLink>
    </main>
  );
}
