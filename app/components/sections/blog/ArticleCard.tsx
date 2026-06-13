"use client";

import { AppImage as Image } from "@/app/components/ui/AppImage";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import {
  type Article,
  type Tag,
  formatDate,
  formatReadTime,
  isExternalUrl,
} from "@/app/lib/article-types";
import Avatar from "@/app/components/ui/Avatar";
import Divider from "@/app/components/ui/Divider";
import Dot from "@/app/components/ui/Dot";

/** Pill overlaying the cover with the article's category. */
function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="absolute left-4 top-4 rounded-full bg-background px-3 py-1 text-xs font-semibold text-accent">
      {name}
    </span>
  );
}

/** Read-time · date meta row. */
function ArticleMeta({ readTime, date }: { readTime: number; date: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>{formatReadTime(readTime)}</span>
      <Dot />
      <span>{formatDate(date)}</span>
    </div>
  );
}

/** Up to three `#tag` chips. */
function TagList({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map((t) => (
        <span
          key={t.id}
          className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted"
        >
          #{t.name}
        </span>
      ))}
    </div>
  );
}

/** Avatar + author name byline pinned to the bottom of the card. */
function AuthorByline({ author }: { author: Article["author"] }) {
  const name = author?.name ?? "energiebee";
  return (
    <div className="mt-auto pt-3">
      <Divider />
      <div className="mt-3 flex items-center gap-3">
        <Avatar
          name={name}
          avatarUrl={author?.avatarUrl}
          className="h-10 w-10"
        />
        <span className="text-sm font-semibold text-foreground">{name}</span>
      </div>
    </div>
  );
}

/**
 * Public-blog article card — cover image with category badge, then meta,
 * title, excerpt, tags, and an author byline. Linked to the article page.
 */
export function ArticleCard({ a, basePath }: { a: Article; basePath: string }) {
  const apiURL = process.env.NEXT_PUBLIC_API_URL;
  return (
    <>
      {/* Warm up the cross-origin media host (React 19 hoists + dedups this). */}
      <link rel="preconnect" href={apiURL} />
      <Link
        title={a.title}
        href={`${basePath}/${a.slug}`}
        className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] transition duration-300 hover:shadow-xl"
      >
        <div className="relative h-43">
          <Image
            src={a.coverImage}
            alt={a.coverImageAlt}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-103 motion-reduce:transform-none motion-reduce:transition-none"
            unoptimized={isExternalUrl(a.coverImage)}
          />
          <CategoryBadge name={a.category?.name ?? "Uncategorised"} />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <ArticleMeta readTime={a.readTime} date={a.authorDate} />
          <h3 className="mt-3 line-clamp-2 text-xl font-extrabold leading-snug text-foreground">
            {a.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
            {a.description}
          </p>
          <TagList tags={a.tags} />
          <AuthorByline author={a.author} />
        </div>
      </Link>
    </>
  );
}
