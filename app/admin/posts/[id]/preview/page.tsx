import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";
import { getPostArticle } from "@/app/admin/lib/queries";

// Admin-only draft preview — renders any post (incl. drafts) exactly as
// it will appear once published.
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
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#1b1b1b] px-6 py-2.5 text-sm text-white">
        <span className="font-semibold">
          Preview · {article.blog} ·{" "}
          <span className="text-[#FFB4A8]">draft view</span>
        </span>
        <Link
          href={`/admin/posts/${id}/edit`}
          className="rounded-md bg-white/15 px-3 py-1 font-medium hover:bg-white/25"
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
