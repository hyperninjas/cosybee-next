"use client";

import { useState } from "react";
import { Check, Copy } from "@gravity-ui/icons";
import { toast } from "@heroui/react";

/**
 * Clipboard button for a short value (email, phone). Hidden until the wrapper
 * marked `group/copy` is hovered — or the button itself is keyboard-focused —
 * but it always occupies its space, so revealing it never shifts layout. Shows
 * a check for a moment after a successful copy.
 *
 * The group name is hardcoded rather than a prop: Tailwind scans source for
 * literal class strings, so an interpolated `group-hover/${name}` would never
 * be generated. Wrap the call site in `group/copy`.
 */
export default function CopyButton({
  label,
  value,
  className = "",
}: {
  /** What's being copied, for the accessible name ("Copy email address"). */
  label: string;
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.danger("Couldn't copy — please select and copy manually.");
    }
  };

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={onCopy}
      className={`inline-flex shrink-0 items-center justify-center rounded-md p-1 text-muted no-underline opacity-100 transition-opacity duration-150 hover:text-warning focus-visible:opacity-100 group-hover/copy:opacity-100 group-focus-within/copy:opacity-100 ${className}`}
    >
      {copied ? (
        <Check className="size-3.5 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
