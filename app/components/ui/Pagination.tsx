"use client";

import { useMemo } from "react";
import { Pagination as HeroPagination } from "@heroui/react";

/**
 * Numbered pagination for the unfiltered "browse" view of a blog hub, styled
 * with the shared HeroUI Pagination primitive so it matches the admin table.
 *
 * Paging is client-side: `onPageChange` updates the owner's page state (which
 * re-slices the already-loaded article set instantly and mirrors `?page=N` into
 * the URL via replaceState — no server round-trip, no full re-render).
 * Crawlability is preserved by the `rel="prev"/"next"` hints the hub page emits
 * into <head>: a crawler loading `?page=N` directly gets the server-rendered
 * slice, and `parsePage` seeds this control's initial page from that URL.
 *
 * Note: the page-list logic is kept inline (not a module-level helper) because
 * the React Compiler instruments standalone functions with their own memo
 * cache — invoking one from an event handler then throws "invalid hook call".
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  // Compact page list with ellipses: always first/last, plus a window around
  // the current page.
  const pages = useMemo<(number | "ellipsis")[]>(() => {
    const out: (number | "ellipsis")[] = [];
    const window = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 ||
        p === totalPages ||
        (p >= page - window && p <= page + window)
      ) {
        out.push(p);
      } else if (out[out.length - 1] !== "ellipsis") {
        out.push("ellipsis");
      }
    }
    return out;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  return (
    <HeroPagination className="mx-auto w-full max-w-360 flex-wrap justify-center gap-2 px-6 pb-16 sm:px-10 lg:px-30">
      <HeroPagination.Content>
        <HeroPagination.Item>
          <HeroPagination.Previous
            isDisabled={page <= 1}
            onPress={() => go(page - 1)}
          >
            <HeroPagination.PreviousIcon />
            <span>Previous</span>
          </HeroPagination.Previous>
        </HeroPagination.Item>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <HeroPagination.Item key={`ellipsis-${i}`}>
              <HeroPagination.Ellipsis />
            </HeroPagination.Item>
          ) : (
            <HeroPagination.Item key={p}>
              <HeroPagination.Link isActive={p === page} onPress={() => go(p)}>
                {p}
              </HeroPagination.Link>
            </HeroPagination.Item>
          ),
        )}

        <HeroPagination.Item>
          <HeroPagination.Next
            isDisabled={page >= totalPages}
            onPress={() => go(page + 1)}
          >
            <span>Next</span>
            <HeroPagination.NextIcon />
          </HeroPagination.Next>
        </HeroPagination.Item>
      </HeroPagination.Content>
    </HeroPagination>
  );
}
