"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) — and, just as importantly,
 * UNREGISTERS it when it shouldn't be active.
 *
 * It only runs on a real deployed host. On localhost it stays off and actively
 * tears down any leftover worker + caches, because a service worker registered
 * during a local `next start` would otherwise keep serving stale cached chunks
 * back to `next dev` — producing duplicate-React / "invalid hook call" errors
 * that survive cache clears and only a hard reload escapes.
 *
 * Note: every check is inlined in the effect on purpose. Module-level helper
 * functions get instrumented by React Compiler (`compilationMode: 'all'`) and
 * throw "invalid hook call" when called from an effect — keep them local.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const host = window.location.hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".local");
    const enabled = process.env.NODE_ENV === "production" && !isLocal;

    if (!enabled) {
      // Self-heal: remove any worker + caches left over from a local
      // production run so they stop intercepting dev requests.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if (window.caches) {
        caches
          .keys()
          .then((keys) => keys.forEach((k) => caches.delete(k)))
          .catch(() => {});
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) =>
          console.error("Service worker registration failed:", err),
        );
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
