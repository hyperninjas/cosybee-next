"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Segment-level error boundary. Catches errors thrown anywhere in the
 * route below the root layout — Navbar/Footer still render normally so
 * the user keeps their bearings.
 *
 * Must be a Client Component (uses event handlers and effects).
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wire your error reporter (Sentry, etc.) here.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        Something went wrong
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        We hit a snag
      </h1>
      <p className="mt-4 max-w-md text-base text-muted">
        An unexpected error occurred while loading this page. The team has
        been notified. Try again, or head back to the homepage.
      </p>

      {error.digest && (
        <p className="mt-3 text-xs text-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-8 py-3 text-base font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-8 py-3 text-base font-medium text-foreground transition hover:bg-background"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
