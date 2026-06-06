import type { Metadata } from "next";
import { getAllArticles } from "@/app/lib/articles";
import type { Article } from "@/app/lib/article-types";
import { ArticleCard } from "@/app/components/sections/blog/BlogLatestArticles";

export const metadata: Metadata = {
  title: "Search",
  description: "Search EnergieBee guides, stories, and energy-saving advice.",
  alternates: { canonical: "/search" },
  // Internal search results shouldn't be indexed, but links should be followed.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim();

  let results: Article[] = [];
  if (query) {
    const [hive, learn] = await Promise.all([
      getAllArticles("hive"),
      getAllArticles("learn"),
    ]);
    const needle = query.toLowerCase();
    results = [...hive, ...learn].filter((a) => {
      const haystack = [a.title, a.description, a.category?.name ?? "", ...a.tags.map((t) => t.name)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-300 px-6 pt-16 pb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Search
        </h1>
        <p className="mt-2 text-base text-muted">
          Find guides, stories, and energy-saving advice across the EnergieBee
          blog.
        </p>

        <form
          action="/search"
          method="get"
          role="search"
          className="mt-6 flex gap-3"
        >
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search articles…"
            aria-label="Search articles"
            autoFocus
            className="w-full max-w-md rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground outline-none transition focus:border-[#EE3D1A] focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
          >
            Search
          </button>
        </form>

        {query && (
          <p className="mt-6 text-sm text-muted">
            {results.length === 0
              ? `No results for “${query}”.`
              : `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”.`}
          </p>
        )}
      </section>

      {results.length > 0 && (
        <section className="mx-auto w-full max-w-300 px-6 pb-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a) => (
              <ArticleCard
                key={`${a.blog}/${a.slug}`}
                a={a}
                basePath={`/${a.blog}`}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
