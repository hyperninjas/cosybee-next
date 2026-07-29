"use client";

import CopyButton from "@/app/components/ui/CopyButton";

/**
 * An email/phone link in running prose with a hover-revealed copy button.
 * Renders inline so it sits inside a <p> without breaking the line box; the
 * link itself keeps whatever anchor styling the surrounding prose applies.
 *
 * `whitespace-nowrap` keeps the icon glued to the end of the address instead
 * of wrapping onto its own line.
 */
export default function ContactLink({
  href,
  value,
  label,
  children,
}: {
  /** `mailto:` or `tel:` target. */
  href: string;
  /** Exact text placed on the clipboard. Defaults to the visible text. */
  value?: string;
  /** Accessible name for the button, e.g. "email address". */
  label: string;
  children: string;
}) {
  return (
    <span className="group/copy inline-flex items-baseline gap-0.5 whitespace-nowrap">
      <a href={href}>{children}</a>
      <CopyButton label={label} value={value ?? children} />
    </span>
  );
}
