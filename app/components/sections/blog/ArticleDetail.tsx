import Image from "next/image";
import Link from "next/link";
import {
  type Article,
  formatDate,
  formatReadTime,
  isExternalUrl,
  PLACEHOLDER_COVER,
} from "@/app/lib/article-types";
import { buildToc } from "@/app/lib/toc";
import { renderLegacyContent, isLegacyContent } from "@/app/lib/legacy-content";
import { contentJsonToHtml } from "@/app/lib/blocknote";
import { ArticleCard } from "./ArticleCard";
import { MoreArticlesCard } from "./MoreArticlesCard";
import { CtaButton } from "@/app/components/ui/Cta";
import Dot from "@/app/components/ui/Dot";
import Avatar from "@/app/components/ui/Avatar";
import ShareButton from "./ShareButton";
import ReadingProgress from "./ReadingProgress";
import ArticleToc from "./ArticleToc";
import JsonLd from "@/app/components/JsonLd";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import { blogPostingSchema, breadcrumbSchema } from "@/app/lib/structured-data";

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
export default async function ArticleDetail({
  article,
  related,
  basePath,
}: Props) {
  // Resolve the article body. The document is authored in BlockNote, so the
  // BlockNote server renderer is the source of truth: render `contentJson`
  // with the shared schema (multi-column included) for perfect fidelity.
  // Older posts may instead carry the legacy `{ sections }` shape, and we keep
  // the backend-rendered `contentHtml` as a last-resort fallback.
  let rawHtml: string;
  if (isLegacyContent(article.contentJson)) {
    rawHtml =
      renderLegacyContent(article.contentJson) ?? article.contentHtml ?? "";
  } else {
    const blockNoteHtml = article.contentJson
      ? await contentJsonToHtml(article.contentJson)
      : "";
    rawHtml = blockNoteHtml || article.contentHtml || "";
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
      {/* Prefer the backend-rendered Article schema when present — single
          source of truth. Fall back to the locally-built schema only when
          the backend didn't ship it (older API responses). Breadcrumb
          schema is always our own concern. */}
      <JsonLd
        data={[
          article.jsonLd ?? blogPostingSchema(article, path),
          breadcrumbSchema(crumbs),
        ]}
      />
      <ReadingProgress targetSelector="#article-body" />
      <div className="mx-auto flex max-w-300 justify-center gap-10 px-0 xl:px-6">
        <article
          id="article-body"
          className="w-full max-w-225 px-6 pt-10 pb-16 sm:px-5 xl:px-0 lg:pt-18.5 lg:pb-20"
        >
          {/* breadcrumb trail (replaces the old "Back to Blog" button) */}
          <Breadcrumbs items={crumbs} />

          {/* title + meta */}
          <header className="mt-4 lg:mt-7">
            <h1 className="text-[24px] font-bold text-foreground sm:text-[28px]">
              {article.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center rounded-full border border-border bg-[#EBF2F5] px-1.5 py-[2.5px] text-xs font-semibold">
                {article.category?.name ?? "Uncategorised"}
              </span>
              <Dot />
              <span className="text-muted">
                {formatReadTime(article.readTime)}
              </span>
            </div>
            {article.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`${basePath}/tag/${tag.slug}`}
                    className="inline-flex items-center rounded-full bg-[#F3F3F3] px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-[#E6EEF1] hover:text-[#1b4a5e]"
                  >
                    {`#${tag.name}`}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={article.author?.name ?? "energiebee"}
                  avatarUrl={article.author?.avatarUrl}
                />
                <div className="text-sm">
                  {article.author?.slug ? (
                    <Link
                      href={`/author/${article.author.slug}`}
                      className="font-bold text-lg text-foreground transition-colors hover:text-[#FF8A7A]"
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

          {/* hero image — wrapped as <figure> so any caption/credit the
              author entered renders semantically with the image. Skipped
              entirely for coverless posts: we don't show the listing
              placeholder as an article hero. */}
          {article.coverImage !== PLACEHOLDER_COVER && (
            <figure className="mt-10">
              <div
                {...(article.coverImageTitle
                  ? { title: article.coverImageTitle }
                  : {})}
                className="relative aspect-video overflow-hidden rounded-3xl sm:aspect-video"
              >
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
              {(article.coverImageCaption || article.coverImageCredit) && (
                <figcaption className="mt-3 px-2 text-sm text-[#545454] sm:px-0">
                  {article.coverImageCaption && (
                    <span>{article.coverImageCaption}</span>
                  )}
                  {article.coverImageCaption && article.coverImageCredit && (
                    <span aria-hidden> · </span>
                  )}
                  {article.coverImageCredit && (
                    <span className="text-[#787878]">
                      {article.coverImageCredit}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* lede / subtitle */}
          {article.lede && (
            <p className="mt-10 text-lg font-bold leading-snug hidden text-foreground sm:text-xl">
              {article.lede}
            </p>
          )}

          {/* body — server-rendered HTML from the BlockNote document */}
          <div
            className="article-body mt-10 text-foreground wrap-break-word [&_a]:break-all"
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

        {(toc.length > 1 || related.length > 0) && (
          // The whole sidebar is sticky: `self-start` keeps it content-height
          // (a stretched flex item can't stick), and max-height + overflow let
          // it scroll internally when the TOC + cards exceed the viewport.
          <aside className="sticky top-24 mt-18 hidden max-h-full w-100 shrink-0 flex-col gap-10 self-start overflow-y-auto px-5 -mx-5 pb-8 xl:flex">
            {/* sticky={false}: the aside already pins it. */}
            {toc.length > 1 && <ArticleToc items={toc} sticky={false} />}

            {related.length > 0 && (
              <div>
                <h2 className="text-lg font-extrabold text-foreground">
                  More blogs
                </h2>
                <div className="mt-4 flex flex-col gap-1">
                  {related.map((a) => (
                    <MoreArticlesCard key={a.slug} a={a} basePath={basePath} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
      {/* more blogs */}
      {related.length > 0 && (
        <section className="mx-auto max-w-225 px-6 pb-16 sm:px-5 lg:pb-24 xl:hidden">
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
