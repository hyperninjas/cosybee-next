"use client";

import dynamic from "next/dynamic";

/**
 * Non-visual, non-SEO client utilities that are not needed for first paint:
 * the toast portal host, the service-worker registrar, and the PWA install
 * prompt. They render nothing meaningful into the initial HTML, so we load
 * them with `ssr: false` to keep them out of the server response AND defer
 * their JS until after the page is interactive — off the LCP/TBT critical
 * path. `ssr: false` can't live in the root layout (a Server Component), so
 * this Client Component owns the `dynamic()` calls (see Next.js lazy-loading
 * guide: "move it into a Client Component").
 */
const Toaster = dynamic(
  () => import("./ui/Toaster").then((m) => m.Toaster),
  { ssr: false }
);
const ServiceWorkerRegistration = dynamic(
  () => import("./ServiceWorkerRegistration"),
  { ssr: false }
);
const InstallPrompt = dynamic(() => import("./InstallPrompt"), { ssr: false });

export function DeferredClientLayer() {
  return (
    <>
      <Toaster />
      <ServiceWorkerRegistration />
      <InstallPrompt />
    </>
  );
}
