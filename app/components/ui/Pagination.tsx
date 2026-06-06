import Link from "next/link";

/** Build the href for a page — page 1 is the bare hub URL (clean canonical). */
function hrefFor(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/**
 * Compact page list with ellipses: always first/last, plus a window around the
 * current page.
 */
function pageList(page: number, totalPages: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - window && p <= page + window)) {
      out.push(p);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}

/**
 * Crawlable numbered pagination for the unfiltered "browse" view of a blog hub.
 * Renders real <a> links to ?page=N so search engines can reach every article;
 * pair with rel="prev"/"next" <link>s in the hub page head. Only used when no
 * filter/search is active — filtered views paginate client-side instead.
 */
export default function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const linkCls =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent";
  const currentCls =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-accent bg-[#FFF5F2] px-3 text-sm font-bold text-accent";
  const disabledCls =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-muted";

  return (
    <nav
      aria-label="Pagination"
      className="mx-auto flex max-w-360 flex-wrap items-center justify-center gap-2 px-6 pb-16 sm:px-10 lg:px-30"
    >
      {page > 1 ? (
        <Link href={hrefFor(basePath, page - 1)} rel="prev" className={linkCls}>
          ← Previous
        </Link>
      ) : (
        <span aria-disabled className={disabledCls}>
          ← Previous
        </span>
      )}

      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={currentCls}>
            {p}
          </span>
        ) : (
          <Link key={p} href={hrefFor(basePath, p)} className={linkCls}>
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(basePath, page + 1)} rel="next" className={linkCls}>
          Next →
        </Link>
      ) : (
        <span aria-disabled className={disabledCls}>
          Next →
        </span>
      )}
    </nav>
  );
}
