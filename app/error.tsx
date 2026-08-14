"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

const STALE_BUNDLE_RELOAD_KEY = "amata-stale-bundle-reload";

function isStaleServerActionError(error: Error) {
  return /Failed to find Server Action/i.test(error.message);
}

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const stale = isStaleServerActionError(error);

  useEffect(() => {
    if (!stale) return;
    // A stale cached bundle references a server action ID from a previous
    // deploy. reset() alone won't help — it re-renders the same stale JS.
    // Force one real reload to fetch the current build; guard against a
    // reload loop if the error somehow persists past a fresh fetch.
    if (sessionStorage.getItem(STALE_BUNDLE_RELOAD_KEY)) return;
    sessionStorage.setItem(STALE_BUNDLE_RELOAD_KEY, "1");
    window.location.reload();
  }, [stale]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50">
          <AlertTriangle className="size-8 text-red-500" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">
          An unexpected error occurred. Our team has been notified.
          {error.digest && (
            <span className="mt-2 block text-xs font-mono text-muted-foreground/60">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md"
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-lg border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
