"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

/**
 * Custom "Add to Home Screen" prompt for the PWA.
 *
 * Chromium (Android + desktop Chrome/Edge) fires `beforeinstallprompt`, which
 * we capture to show our own branded banner instead of the browser's default.
 * iOS Safari has no such event, so we detect it and show manual instructions.
 *
 * The banner is dismissible and the choice is remembered for two weeks so it
 * never nags. It never appears once the app is already installed.
 *
 * Note: all helpers live *inside* the component as closures. They must not be
 * module-level functions — with React Compiler `compilationMode: 'all'` those
 * get instrumented with the memo-cache hook, and calling them from an effect
 * or event handler (outside render) throws "invalid hook call".
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "eb-install-dismissed";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
// iOS gives no install event, so reveal the instructions after a short delay
// to avoid competing with the page's first paint.
const IOS_REVEAL_DELAY = 4000;

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't surface the prompt inside the admin panel.
    if (pathname.startsWith("/admin")) return;

    // Already installed? Never prompt.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari exposes this non-standard flag when launched from home screen.
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Recently dismissed? Stay quiet.
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY)) || 0;
    } catch {
      dismissedAt = 0;
    }
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    // iOS Safari: no beforeinstallprompt — show manual instructions.
    const ios =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
      !/crios|fxios|edgios/i.test(window.navigator.userAgent);
    if (ios) {
      const t = setTimeout(() => {
        setIsIOS(true);
        setVisible(true);
      }, IOS_REVEAL_DELAY);
      return () => clearTimeout(t);
    }

    // Chromium: capture the event and show our own banner.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pathname]);

  const remember = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore quota / disabled storage */
    }
  };

  const dismiss = () => {
    setVisible(false);
    remember();
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    remember();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install EnergieBee"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-black/10 bg-surface p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:right-4"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-surface-secondary hover:text-muted"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Image
          src="/icon"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Install EnergieBee</p>
          {isIOS ? (
            <p className="mt-1 text-sm leading-snug text-muted">
              Tap the Share button{" "}
              <span aria-hidden="true">⎋</span> then{" "}
              <span className="font-medium text-foreground">
                &ldquo;Add to Home Screen&rdquo;
              </span>{" "}
              for instant, app-like access.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-snug text-muted">
              Add it to your home screen for faster, app-like access — even
              offline.
            </p>
          )}

          {!isIOS && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-[0_12px_24px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
              >
                Install app
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
