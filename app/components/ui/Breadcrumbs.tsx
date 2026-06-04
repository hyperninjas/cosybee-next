import Link from "next/link";

/**
 * Visible breadcrumb trail. Pair it with `breadcrumbSchema(items)` JSON-LD
 * (same items) so the on-page trail and the structured data match. The last
 * item is rendered as the current page (not a link) and marked aria-current.
 */
export default function Breadcrumbs({
  items,
  className = "",
  tone = "light",
}: {
  items: { name: string; path: string }[];
  className?: string;
  /** "light" = dark text on light bg (default). "dark" = light text on a dark hero. */
  tone?: "light" | "dark";
}) {
  if (items.length === 0) return null;

  const isDark = tone === "dark";
  const base = isDark ? "text-white/70" : "text-[#787878]";
  const current = isDark ? "text-white" : "text-[#545454]";
  const sep = isDark ? "text-white/40" : "text-[#C4C4C4]";
  const hover = isDark ? "hover:text-white" : "hover:text-[#FF8A7A]";

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={`flex flex-wrap items-center gap-1.5 text-xs ${base}`}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className={`font-medium ${current}`}>
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className={`transition-colors ${hover}`}
                >
                  {item.name}
                </Link>
              )}
              {!isLast && (
                <span aria-hidden className={sep}>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
