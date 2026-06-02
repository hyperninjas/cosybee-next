import Image from "next/image";
import Link from "next/link";
import { type Article } from "@/app/lib/articles";
import { ArticleCard } from "./BlogLatestArticles";
import { CtaButton } from "../../ui/Cta";
import Dot from "../../ui/Dot";
import Avatar from "../../ui/Avatar";

const URL_RE = /(https?:\/\/[^\s)]+)/g;

/** Split a paragraph string into text + clickable links. Trailing
 *  punctuation tucked onto the URL ("…2024.") is pulled back into
 *  the text so it doesn't end up inside the href. */
function linkify(text: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const trail = part.match(/[.,;:!?]+$/)?.[0] ?? "";
      const href = trail ? part.slice(0, -trail.length) : part;
      return (
        <span key={i}>
          <a
            href={href}
            // target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[#1b6ac9] underline transition-colors hover:text-[#0b4ec9]"
          >
            {href}
          </a>
          {trail}
        </span>
      );
    }
    return part;
  });
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

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

type Props = {
  /** Article with a guaranteed body (caller handles notFound). */
  article: Article & { body: NonNullable<Article["body"]> };
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
  return (
    <main className="flex-1">
      <article className="mx-auto max-w-225 px-6 pt-10 pb-16 sm:px-5 lg:pt-18.5 lg:pb-20">
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
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center rounded-full border border-[#DBE6EB] bg-[#EBF2F5] px-1.5 py-[2.5px] text-xs font-semibold">
              {article.category}
            </span>
            <Dot />
            <span className="text-[#545454]">{article.readTime}</span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={article.author.name} />
              <div className="text-sm">
                <div className="font-bold text-lg text-black">
                  {article.author.name}
                </div>
                <div className="text-[#545454] text-[15px] mt-1 font-medium">
                  {article.author.date}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Share article"
              className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#F6F6F6] bg-white text-black transition-colors hover:bg-neutral-50"
            >
              <ShareIcon />
            </button>
          </div>
        </header>

        {/* hero image */}
        <div className="relative mt-10 aspect-4/3 overflow-hidden rounded-3xl sm:aspect-16/10">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            priority
            sizes="(min-width: 800px) 800px, 100vw"
            className="object-cover"
          />
        </div>

        {/* lede / subtitle */}
        {article.body.lede && (
          <p className="mt-10 px-10 lg:px-20 text-lg font-bold leading-snug text-black sm:text-xl">
            {article.body.lede}
          </p>
        )}

        {/* body */}
        <div className="mt-10 px-10 lg:px-20 space-y-6 text-[#545454]">
          {article.body.sections.map((section, sectionIndex) => {
            const blocks = section.blocks ?? section.paragraphs ?? [];
            return (
              <section key={sectionIndex}>
                {section.heading && (
                  <h2 className="text-xl max-w-147.5 font-bold leading-tight text-black sm:text-[28px]">
                    {section.heading}
                  </h2>
                )}
                {blocks.map((block, i) => {
                  const spacing = section.heading || i > 0 ? "mt-4" : "";
                  if (typeof block === "string") {
                    return (
                      <p
                        key={i}
                        className={`leading-relaxed text-base ${spacing}`}
                      >
                        {linkify(block)}
                      </p>
                    );
                  }
                  return (
                    <ul
                      key={i}
                      className={`list-disc space-y-2 pl-6 ${spacing}`}
                    >
                      {block.items.map((item, j) => (
                        <li
                          key={j}
                          className="leading-relaxed text-base marker:text-[#545454]"
                        >
                          {linkify(item)}
                        </li>
                      ))}
                    </ul>
                  );
                })}
              </section>
            );
          })}
        </div>

        {/* in-body image */}
        {article.body.inlineImage && (
          <div className="relative mt-12 aspect-video overflow-hidden rounded-3xl">
            <Image
              src={article.body.inlineImage.src}
              alt={article.body.inlineImage.alt}
              fill
              sizes="(min-width: 800px) 800px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {/* end-of-article CTA */}
        {article.body.cta && (
          <div className="mt-12 flex justify-center px-10 lg:px-20">
            <CtaButton
              href={article.body.cta.href ?? "#"}
              size="md"
              className="text-lg!"
            >
              {article.body.cta.label}
            </CtaButton>
          </div>
        )}
      </article>

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
