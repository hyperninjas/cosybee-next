import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelatedArticles,
} from "@/app/lib/hive-articles";
import { ArticleCard } from "@/app/components/sections/hive/HiveLatestArticles";
import Dot from "@/app/components/ui/Dot";
import Avatar from "@/app/components/ui/Avatar";

/** Prerender every routable article at build time. Slugs without a
 *  body are intentionally excluded — they're card-only stubs. */
export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/hive/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article?.body) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/hive/${article.slug}` },
    openGraph: {
      url: `/hive/${article.slug}`,
      title: `${article.title} — energiebee`,
      description: article.description,
      type: "article",
      images: [{ url: article.image.src, alt: article.imageAlt }],
    },
  };
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

// function MoreBlogsCard({ a }: { a: HiveArticle }) {
//   return (
//     <Link
//       href={`/hive/${a.slug}`}
//       className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
//     >
//       <div className="relative aspect-4/3">
//         <Image
//           src={a.image}
//           alt=""
//           fill
//           sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
//           className="object-cover"
//         />
//       </div>
//       <div className="p-6">
//         <div className="flex flex-wrap items-center gap-3 text-xs text-[#545454]">
//           <span>{a.readTime}</span>
//           <span className="text-neutral-300">•</span>
//           <span>{a.author.date}</span>
//           <span className="ml-auto rounded-full bg-[#FEF6C7] px-3 py-1 text-[11px] font-semibold text-[#B45309]">
//             {a.category}
//           </span>
//         </div>
//         <h3 className="mt-4 text-lg font-bold leading-snug text-black">
//           {a.title}
//         </h3>
//         <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#545454]">
//           {a.description}
//         </p>
//         <div className="mt-5 flex items-center gap-3 border-t border-neutral-100 pt-4">
//           <div className="h-8 w-8 rounded-full bg-neutral-200" aria-hidden />
//           <span className="text-sm font-medium text-black">
//             {a.author.name}
//           </span>
//         </div>
//       </div>
//     </Link>
//   );
// }

export default async function HiveArticlePage({
  params,
}: PageProps<"/hive/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article?.body) notFound();

  const moreBlogs = getRelatedArticles(article.slug);

  return (
    <main className="flex-1">
      <article className="mx-auto max-w-225 px-6 pt-10 pb-16 sm:px-5 lg:pt-18.5 lg:pb-20">
        {/* back link */}
        <Link
          href="/hive"
          className="inline-flex items-center gap-2 rounded-lg border border-[#FF8A7A] px-4 py-2 text-sm font-medium text-[#FF8A7A] transition-colors hover:bg-[#FFF5F2]"
        >
          <BackArrow />
          Back to Blog
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

        {/* body */}
        <div className="mt-10 px-10 lg:px-20 space-y-6 text-[#545454]">
          {article.body.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl max-w-147.5 font-bold leading-tight text-black sm:text-[28px]">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mt-4 leading-relaxed text-base">
                  {p}
                </p>
              ))}
            </section>
          ))}
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
      </article>

      {/* more blogs */}
      {moreBlogs.length > 0 && (
        <section className="mx-auto max-w-225 px-6 pb-16 sm:px-5 lg:pb-24">
          <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
            More blogs
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {moreBlogs.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
