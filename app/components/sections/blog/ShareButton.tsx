"use client";

import { useState } from "react";

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

/**
 * Share the current article via the Web Share API where available,
 * falling back to copying the URL to the clipboard with brief
 * "Copied!" feedback.
 */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or unsupported — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — nothing more we can do
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share article"
      className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-background"
    >
      <ShareIcon />
      {copied && (
        <span className="absolute -top-8 right-0 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-white">
          Link copied!
        </span>
      )}
    </button>
  );
}
