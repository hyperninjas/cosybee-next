import type { Metadata } from "next";
import { AppLink as Link } from "@/app/components/ui/AppLink";

/**
 * Offline fallback. Precached by the service worker (public/sw.js) and shown
 * when a navigation fails and no cached copy of the page exists. Kept free of
 * runtime data and out of the search index.
 */
export const metadata: Metadata = {
  title: "You're offline",
  description: "You appear to be offline. Reconnect to keep browsing EnergieBee.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        Offline
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        You&rsquo;re offline
      </h1>
      <p className="mt-4 max-w-md text-base text-muted">
        We couldn&rsquo;t reach the network. Pages you&rsquo;ve already visited
        are still available — otherwise, reconnect and try again.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-accent px-8 py-3 text-base font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
      >
        Back to home
      </Link>
    </main>
  );
}
