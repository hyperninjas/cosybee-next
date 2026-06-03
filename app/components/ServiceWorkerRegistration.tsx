"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) on the client.
 *
 * Production only — registering in dev would cache Turbopack's hot-reload
 * assets and make local changes appear stale. Registration is deferred to the
 * window `load` event so it never competes with critical first-paint resources.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) => console.error("Service worker registration failed:", err));
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
