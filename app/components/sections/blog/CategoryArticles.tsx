import { AppLink as Link } from "@/app/components/ui/AppLink";
import { ArticleCard } from "./ArticleCard";
import CategoryChips from "./CategoryChips";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema, collectionPageSchema } from "@/app/lib/structured-data";
import type { Article, CategorySummary } from "@/app/lib/article-types";

/**
 * Indexable category landing page body, shared by /hive/category/[slug] and
 * /learn/category/[slug]. Breadcrumb + CollectionPage JSON-LD, a heading, the
 * category row, and the matching article grid.
 *
 * Deliberately close to TaggedArticles rather than merged with it: the two
 * taxonomies read differently (a category is a section of the blog, a tag is a
 * label — hence "#tag" and no chip row there), and folding both into one
 * component would mean a `kind` prop switching copy and layout in three places.
 * If a third taxonomy ever appears, that's the moment to generalise.
 *
 * The full set renders in one grid, no pagination — the same choice the tag
 * pages make. Revisit if a category outgrows a comfortable single page.
 */
export default function CategoryArticles({
  label,
  blogLabel,
  basePath,
  categorySlug,
  categories,
  articles,
}: {
  /** Human-readable category name. */
  label: string;
  /** "The Hive" | "Learn". */
  blogLabel: string;
  /** "/hive" | "/learn". */
  basePath: string;
  /** Slug used in the URL. */
  categorySlug: string;
  /** Every category with published articles, for the chip row. */
  categories: readonly CategorySummary[];
  articles: Article[];
}) {
  const path = `${basePath}/category/${categorySlug}`;

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: blogLabel, path: basePath },
            { name: label, path },
          ]),
          collectionPageSchema({
            name: `${label} — ${blogLabel}`,
            description: `${label} articles from EnergieBee.`,
            path,
            items: articles.map((a) => ({
              title: a.title,
              path: `${basePath}/${a.slug}`,
            })),
          }),
        ]}
      />

      <section className="mx-auto w-full max-w-300 px-6 pt-16 pb-6">
        <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
          <Link href={basePath} className="hover:text-foreground">
            {blogLabel}
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{label}</span>
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {label}
        </h1>
        <p className="mt-2 text-base text-muted">
          {articles.length} article{articles.length === 1 ? "" : "s"} in{" "}
          <span className="font-medium text-foreground">{label}</span> on{" "}
          {blogLabel}.
        </p>
        {/* Sibling categories stay one click away, so a search landing here
            can move sideways instead of bouncing. */}
        <CategoryChips
          categories={categories}
          basePath={basePath}
          activeSlug={categorySlug}
          className="mt-6"
        />
      </section>

      <section className="mx-auto w-full max-w-300 px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} a={a} basePath={basePath} />
          ))}
        </div>
      </section>
    </main>
  );
}
