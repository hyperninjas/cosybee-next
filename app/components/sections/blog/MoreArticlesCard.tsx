import { AppImage as Image } from "@/app/components/ui/AppImage";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import {
  type Article,
  formatDate,
  formatReadTime,
  isExternalUrl,
} from "@/app/lib/article-types";
import Dot from "@/app/components/ui/Dot";

/**
 * Compact "More articles" card for the sidebar rail — cover thumbnail on the
 * left, title + minimal meta (read time · date) on the right. Deliberately
 * lighter than the full <ArticleCard>: a subtle hover background (no large
 * shadow) so it doesn't get clipped inside the scrollable sticky sidebar.
 */
export function MoreArticlesCard({
  a,
  basePath,
}: {
  a: Article;
  basePath: string;
}) {
  return (
    <Link
      title={a.title}
      href={`${basePath}/${a.slug}`}
      className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-surface-secondary"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={a.coverImage}
          alt={a.coverImageAlt}
          fill
          sizes="112px"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
          unoptimized={isExternalUrl(a.coverImage)}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
          {a.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span>{formatReadTime(a.readTime)}</span>
          <Dot />
          <span>{formatDate(a.authorDate)}</span>
        </div>
      </div>
    </Link>
  );
}
