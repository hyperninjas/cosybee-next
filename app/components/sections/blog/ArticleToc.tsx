"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/app/lib/toc";

/**
 * Table of contents with scroll-spy highlighting. Sticky by default; pass
 * `sticky={false}` when an ancestor (e.g. a sticky sidebar) already pins it,
 * to avoid a redundant nested sticky.
 */
export default function ArticleToc({
  items,
  sticky = true,
}: {
  items: TocItem[];
  sticky?: boolean;
}) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={`text-sm ${sticky ? "sticky top-24" : ""}`}>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
        On this page
      </p>
      <ul className="space-y-2 border-l border-border">
        {items.map((i) => (
          <li key={i.id} style={{ paddingLeft: i.level === 3 ? 24 : 12 }}>
            <a
              href={`#${i.id}`}
              className={`-ml-px block border-l-2 pl-3 leading-snug transition-colors ${
                active === i.id
                  ? "border-accent font-semibold text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
