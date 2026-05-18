import Image from "next/image";
import Link from "next/link";
import { getLatestArticles, type HiveArticle } from "@/app/lib/hive-articles";
import Avatar from "../../ui/Avatar";
import Divider from "../../ui/Divider";
import Dot from "../../ui/Dot";

export function ArticleCard({ a }: { a: HiveArticle }) {
  return (
    <Link
      href={`/hive/${a.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[1.39]">
        <Image
          src={a.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-[15px] max-h-8 font-medium text-[#545454]">
          <span>{a.readTime}</span>
          <Dot />
          <span>{a.author.date}</span>
          <span className="ml-auto h-8 rounded-full border border-[#E6E6E6] bg-[#FAFAFA] px-3 py-1 font-semibold tracking-normal text-[#DE3B24] max-w-32.5 text-nowrap text-ellipsis overflow-hidden">
            {a.category}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-bold leading-snug text-black">
          {a.title}
        </h3>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[#545454]">
          {a.description}
        </p>
        <div className="mt-auto pt-4">
          <Divider />
          <div className="mt-4 flex items-center gap-5">
            <Avatar name={a.author.name} className="h-11 w-11" />
            <span className="text-[15px] font-bold text-black">
              {a.author.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * "Latest Articles" — heading + 3-column responsive grid of article
 * cards + a Load More button. Cards now come from the shared
 * lib/hive-articles source; wire `getLatestArticles` to a real query
 * (or pagination) when content is dynamic.
 */
export default function HiveLatestArticles() {
  const articles = getLatestArticles(3);
  return (
    <section className="mx-auto max-w-360 px-6 py-12 pt-0 sm:px-10 lg:px-30 lg:py-12 lg:pt-0">
      <h2 className="text-2xl font-bold text-black sm:text-[32px]">
        Latest Articles
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {articles.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          className="rounded-[9px] bg-[#F2F4F7] px-8 py-3 text-lg font-bold text-[#1F1F1F] transition-colors hover:bg-neutral-200"
        >
          Load More
        </button>
      </div>
    </section>
  );
}
