import { AppLink as Link } from "@/app/components/ui/AppLink";
import { notFound } from "next/navigation";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";
import { getPostArticle } from "@/app/(private)/admin/lib/queries";

// Admin-only preview — renders any post, published or not, exactly as it will
// appear to a reader. On a live post it shows the STAGED version rather than
// the one readers currently have: previewing the already-published article is
// the one thing an author never needs.
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getPostArticle(id);
  if (!article) notFound();

  return (
    <div className="-mx-6 -my-10">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-foreground px-6 py-2.5 text-sm text-white">
        <span className="font-semibold">
          Preview · {article.blog} ·{" "}
          <span className="text-danger">
            {article.status === "PUBLISHED"
              ? "unpublished changes"
              : article.status === "ARCHIVED"
                ? "archived"
                : "draft view"}
          </span>
        </span>
        <Link
          href={`/admin/posts/${id}/edit`}
          className="rounded-md bg-surface/15 px-3 py-1 font-medium hover:bg-surface/25"
        >
          ← Back to editor
        </Link>
      </div>
      <ArticleDetail
        article={article}
        related={[]}
        basePath={`/${article.blog}`}
      />
    </div>
  );
}
