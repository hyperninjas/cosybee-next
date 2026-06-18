"use client";

import { useEffect } from "react";

const MESSAGE = "You have unsaved changes. Leave this page and discard them?";

/**
 * Warn before the user loses unsaved edits. While `when` is true this guards
 * the two ways out of the page:
 *
 *  - **Hard navigation** — refresh, tab/window close, typing a new address, or
 *    following an external link — via the native `beforeunload` prompt. The
 *    browser owns that dialog's wording (our message is ignored by design).
 *  - **Soft, in-app navigation** — clicking a Next.js `<Link>`/anchor — via a
 *    capture-phase click interceptor that asks for confirmation first and stops
 *    the router when the user cancels.
 *
 * Not intercepted: the browser Back/Forward buttons (the App Router exposes no
 * stable hook for that) and programmatic `router.push`/server-action redirects
 * (e.g. the post-save redirect, which is intentionally allowed through).
 */
export function useUnsavedChangesWarning(when: boolean) {
  useEffect(() => {
    if (!when) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy requirement for the prompt to show in some browsers.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const onClickCapture = (e: MouseEvent) => {
      // Let non-primary clicks and modifier-clicks (new tab / save link) pass.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;

      let dest: URL;
      try {
        dest = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Same-origin only, and not a click that stays on the current URL.
      if (dest.origin !== window.location.origin) return;
      if (
        dest.pathname === window.location.pathname &&
        dest.search === window.location.search
      )
        return;

      if (!window.confirm(MESSAGE)) {
        // Stop Next's router (and other handlers) from navigating.
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Capture phase so we run before React/Next's own click handlers fire.
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [when]);
}
