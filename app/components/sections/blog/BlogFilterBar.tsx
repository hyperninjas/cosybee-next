"use client";

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

type Props = {
  categories: readonly string[];
  query: string;
  onQueryChange: (q: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
};

/**
 * Controlled search input + horizontal category chip row. Filter
 * state lives in the parent (see BlogBrowse) so the featured carousel
 * and latest grid can react to it. Categories are passed in so each
 * blog (hive, learn, …) can define its own.
 */
export default function BlogFilterBar({
  categories,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: Props) {
  return (
    <div className="mx-auto max-w-360 px-6 py-12 sm:px-10 lg:px-30">
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* search */}
        <label className="relative flex w-full max-w-90.5 items-center">
          <span className="absolute left-4 text-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full rounded-full border border-border bg-surface py-3.25 pl-12 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#EFDF18]/40"
          />
        </label>

        {/* category chips */}
        <div className="flex flex-nowrap overflow-auto items-center gap-2">
          {categories.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`rounded-full px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-accent text-white "
                    : "bg-background text-muted hover:bg-surface-secondary"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
