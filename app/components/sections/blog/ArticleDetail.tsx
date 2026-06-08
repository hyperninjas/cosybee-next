import { AppImage as Image } from "@/app/components/ui/AppImage";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { type Article, formatReadTime } from "@/app/lib/article-types";
import { buildToc } from "@/app/lib/toc";
import { renderLegacyContent, isLegacyContent } from "@/app/lib/legacy-content";
import { ArticleCard } from "./BlogLatestArticles";
import { CtaButton } from "../../ui/Cta";
import Dot from "../../ui/Dot";
import Avatar from "../../ui/Avatar";
import ShareButton from "./ShareButton";
import ReadingProgress from "./ReadingProgress";
import ArticleToc from "./ArticleToc";
import JsonLd from "@/app/components/JsonLd";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import { blogPostingSchema, breadcrumbSchema } from "@/app/lib/structured-data";

/** Check if URL is external (http/https) - these need unoptimized to bypass Next.js Image Optimization. */
function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Format ISO date string to display format. */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

type Props = {
  /** Published article with rendered body HTML (caller handles notFound). */
  article: Article;
  related: Article[];
  /** Link base, e.g. "/hive" or "/learn". */
  basePath: string;
};

/**
 * Renders a full blog article — breadcrumb trail, header/meta, hero image,
 * lede, block body (paragraphs + lists, with auto-linked URLs),
 * optional inline image and end-of-article CTA, plus a related rail.
 * Shared by /hive and /learn article routes.
 */
export default function ArticleDetail({
  article,
  related,
  basePath,
}: Props) {
  // Use contentHtml if available, otherwise render legacy contentJson
  let rawHtml = article.contentHtml ?? "";
  if ((!rawHtml || rawHtml.trim() === "") && isLegacyContent(article.contentJson)) {
    rawHtml = renderLegacyContent(article.contentJson) ?? "";
  }
  // Also use legacy renderer if contentJson has sections with blocks that weren't rendered
  if (isLegacyContent(article.contentJson)) {
    const legacyHtml = renderLegacyContent(article.contentJson);
    // If legacy HTML is longer, it likely has more content (blocks/items)
    if (legacyHtml && legacyHtml.length > rawHtml.length) {
      rawHtml = legacyHtml;
    }
  }
  const { html, items: toc } = buildToc(rawHtml);
  const path = `${basePath}/${article.slug}`;
  const blogLabel = basePath === "/hive" ? "The Hive" : "Learn";
  const crumbs = [
    { name: "Home", path: "/" },
    { name: blogLabel, path: basePath },
    { name: article.title, path },
  ];

  return (
    <main className="flex-1">
      {/* Warm up the connection to the media host — article images load from
          it cross-origin (React 19 hoists this to <head> and dedups it). */}
      <link rel="preconnect" href="https://eb-api.technext.it" />
      <JsonLd
        data={[blogPostingSchema(article, path), breadcrumbSchema(crumbs)]}
      />
      <ReadingProgress />
      <div className="mx-auto flex max-w-300 justify-center gap-10 px-0 xl:px-6">
      <article className="w-full max-w-225 px-6 pt-10 pb-16 sm:px-5 lg:pt-18.5 lg:pb-20">
        {/* breadcrumb trail (replaces the old "Back to Blog" button) */}
        <Breadcrumbs items={crumbs} />

        {/* title + meta */}
        <header className="mt-10">
          <h1 className="text-[24px] font-bold text-foreground sm:text-[28px]">
            {article.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center rounded-full border border-[#DBE6EB] bg-surface-secondary px-1.5 py-[2.5px] text-xs font-semibold">
              {article.category?.name ?? "Uncategorised"}
            </span>
            <Dot />
            <span className="text-muted">{formatReadTime(article.readTime)}</span>
          </div>
          {article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`${basePath}/tag/${tag.slug}`}
                  className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-[#E6EEF1] hover:text-foreground"
                >
                  {`#${tag.name}`}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={article.author?.name ?? "energiebee"} avatarUrl={article.author?.avatarUrl} />
              <div className="text-sm">
                {article.author?.slug ? (
                  <Link
                    href={`/author/${article.author.slug}`}
                    className="font-bold text-lg text-foreground transition-colors hover:text-accent"
                  >
                    {article.author.name}
                  </Link>
                ) : (
                  <div className="font-bold text-lg text-foreground">
                    {article.author?.name ?? "energiebee"}
                  </div>
                )}
                <time
                  dateTime={article.publishedAt ?? article.authorDate}
                  className="block text-muted text-[15px] mt-1 font-medium"
                >
                  {formatDate(article.authorDate)}
                </time>
              </div>
            </div>
            <ShareButton title={article.title} />
          </div>
        </header>

        {/* hero image */}
        <div className="relative mt-10 aspect-4/3 overflow-hidden rounded-3xl sm:aspect-16/10">
          <Image
            src={article.coverImage}
            alt={article.coverImageAlt}
            fill
            priority
            sizes="(min-width: 800px) 800px, 100vw"
            className="object-cover"
            unoptimized={isExternalUrl(article.coverImage)}
          />
        </div>

        {/* lede / subtitle */}
        {article.lede && (
          <p className="mt-10 px-10 lg:px-20 text-lg font-bold leading-snug text-foreground sm:text-xl">
            {article.lede}
          </p>
        )}

        {/* body — server-rendered HTML from the BlockNote document */}
        <div
          className="article-body mt-10 px-10 lg:px-20 text-muted"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* end-of-article CTA */}
        {article.ctaLabel && article.ctaHref && (
          <div className="mt-12 flex justify-center px-10 lg:px-20">
            <CtaButton
              href={article.ctaHref}
              external={article.ctaExternal}
              size="md"
              className="text-lg!"
            >
              {article.ctaLabel}
            </CtaButton>
          </div>
        )}
      </article>

        {toc.length > 1 && (
          <aside className="hidden w-60 shrink-0 pt-18.5 xl:block">
            <ArticleToc items={toc} />
          </aside>
        )}
      </div>

      {/* more blogs */}
      {related.length > 0 && (
        <section className="mx-auto max-w-225 px-6 pb-16 sm:px-5 lg:pb-24">
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            More blogs
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.slug} a={a} basePath={basePath} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
