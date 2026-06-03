import Link from "next/link";
import { ArticleCard } from "./BlogLatestArticles";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema, collectionPageSchema } from "@/app/lib/structured-data";
import type { Article } from "@/app/lib/article-types";

/**
 * Indexable tag landing page body, shared by /hive/tag/[tag] and
 * /learn/tag/[tag]. Renders breadcrumb + CollectionPage JSON-LD, a heading,
 * and the matching article grid.
 */
export default function TaggedArticles({
  label,
  blogLabel,
  basePath,
  tagSlug,
  articles,
}: {
  /** Human-readable tag (original casing). */
  label: string;
  /** "The Hive" | "Learn". */
  blogLabel: string;
  /** "/hive" | "/learn". */
  basePath: string;
  /** Slugified tag used in the URL. */
  tagSlug: string;
  articles: Article[];
}) {
  const path = `${basePath}/tag/${tagSlug}`;

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: blogLabel, path: basePath },
            { name: `#${label}`, path },
          ]),
          collectionPageSchema({
            name: `${label} — ${blogLabel}`,
            description: `Articles about ${label} from EnergieBee.`,
            path,
            items: articles.map((a) => ({
              title: a.title,
              path: `${basePath}/${a.slug}`,
            })),
          }),
        ]}
      />

      <section className="mx-auto w-full max-w-300 px-6 pt-16 pb-6">
        <nav className="mb-4 text-sm text-neutral-500" aria-label="Breadcrumb">
          <Link href={basePath} className="hover:text-black">
            {blogLabel}
          </Link>
          <span className="px-2">/</span>
          <span className="text-black">#{label}</span>
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
          #{label}
        </h1>
        <p className="mt-2 text-base text-neutral-600">
          {articles.length} article{articles.length === 1 ? "" : "s"} tagged{" "}
          <span className="font-medium text-black">{label}</span>.
        </p>
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
