import Image from "next/image";
import Link from "next/link";
import { type Article, formatReadTime } from "@/app/lib/article-types";
import { buildToc } from "@/app/lib/toc";
import { ArticleCard } from "./BlogLatestArticles";
import { CtaButton } from "../../ui/Cta";
import Dot from "../../ui/Dot";
import Avatar from "../../ui/Avatar";
import ShareButton from "./ShareButton";
import ReadingProgress from "./ReadingProgress";
import ArticleToc from "./ArticleToc";
import JsonLd from "@/app/components/JsonLd";
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

function BackArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

type Props = {
  /** Published article with rendered body HTML (caller handles notFound). */
  article: Article;
  related: Article[];
  /** Link base, e.g. "/hive" or "/learn". */
  basePath: string;
  /** Back-link label, e.g. "Back to Blog". */
  backLabel: string;
};

/**
 * Renders a full blog article — back link, header/meta, hero image,
 * lede, block body (paragraphs + lists, with auto-linked URLs),
 * optional inline image and end-of-article CTA, plus a related rail.
 * Shared by /hive and /learn article routes.
 */
export default function ArticleDetail({
  article,
  related,
  basePath,
  backLabel,
}: Props) {
  const { html, items: toc } = buildToc(article.contentHtml ?? "");
  const path = `${basePath}/${article.slug}`;
  const blogLabel = basePath === "/hive" ? "The Hive" : "Learn";

  return (
    <main className="flex-1">
      {/* Warm up the connection to the media host — article images load from
          it cross-origin (React 19 hoists this to <head> and dedups it). */}
      <link rel="preconnect" href="https://eb-api.technext.it" />
      <JsonLd
        data={[
          blogPostingSchema(article, path),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: blogLabel, path: basePath },
            { name: article.title, path },
          ]),
        ]}
      />
      <ReadingProgress />
      <div className="mx-auto flex max-w-300 justify-center gap-10 px-0 xl:px-6">
      <article className="w-full max-w-225 px-6 pt-10 pb-16 sm:px-5 lg:pt-18.5 lg:pb-20">
        {/* back link */}
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 rounded-lg border border-[#FF8A7A] px-4 py-2 text-sm font-medium text-[#FF8A7A] transition-colors hover:bg-[#FFF5F2]"
        >
          <BackArrow />
          {backLabel}
        </Link>

        {/* title + meta */}
        <header className="mt-10">
          <h1 className="text-[24px] font-bold text-black sm:text-[28px]">
            {article.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center rounded-full border border-[#DBE6EB] bg-[#EBF2F5] px-1.5 py-[2.5px] text-xs font-semibold">
              {article.category?.name ?? "Uncategorised"}
            </span>
            <Dot />
            <span className="text-[#545454]">{formatReadTime(article.readTime)}</span>
          </div>
          {article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`${basePath}/tag/${tag.slug}`}
                  className="inline-flex items-center rounded-full bg-[#F3F3F3] px-2.5 py-1 text-xs font-medium text-[#545454] transition-colors hover:bg-[#E6EEF1] hover:text-[#1b4a5e]"
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
                <div className="font-bold text-lg text-black">
                  {article.author?.name ?? "energiebee"}
                </div>
                <time
                  dateTime={article.publishedAt ?? article.authorDate}
                  className="block text-[#545454] text-[15px] mt-1 font-medium"
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
          <p className="mt-10 px-10 lg:px-20 text-lg font-bold leading-snug text-black sm:text-xl">
            {article.lede}
          </p>
        )}

        {/* body — server-rendered HTML from the BlockNote document */}
        <div
          className="article-body mt-10 px-10 lg:px-20 text-[#545454]"
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
          <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
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
