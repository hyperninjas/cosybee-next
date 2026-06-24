"use client";

import dynamic from "next/dynamic";

/**
 * Non-visual, non-SEO client utilities that are not needed for first paint:
 * the toast portal host. It renders nothing meaningful into the initial HTML,
 * so we load it with `ssr: false` to keep it out of the server response AND
 * defer its JS until after the page is interactive — off the LCP/TBT critical
 * path. `ssr: false` can't live in the root layout (a Server Component), so
 * this Client Component owns the `dynamic()` call (see Next.js lazy-loading
 * guide: "move it into a Client Component").
 */
const Toaster = dynamic(
  () => import("./ui/Toaster").then((m) => m.Toaster),
  { ssr: false }
);

export function DeferredClientLayer() {
  return (
    <>
      <Toaster />
    </>
  );
}
