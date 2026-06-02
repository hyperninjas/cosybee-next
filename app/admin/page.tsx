import Link from "next/link";
import { Suspense } from "react";
import { listPosts } from "./lib/queries";
import PostsTable, { type Row } from "./PostsTable";
import SavedToast from "./SavedToast";

export default async function AdminDashboard() {
  const posts = await listPosts();
  const rows: Row[] = posts.map((p) => ({
    id: p.id,
    blog: p.blog,
    slug: p.slug,
    title: p.title,
    category: p.category,
    status: p.status,
    featured: p.featured,
    coverImage: p.coverImage,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Posts</h1>
          <p className="mt-1 text-sm text-[#545454]">{posts.length} total</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/posts/new?blog=hive"
            className="rounded-lg bg-[#FF8A7A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff7765]"
          >
            New Hive post
          </Link>
          <Link
            href="/admin/posts/new?blog=learn"
            className="rounded-lg border border-[#FF8A7A] px-4 py-2 text-sm font-semibold text-[#FF8A7A] hover:bg-[#FFF5F2]"
          >
            New Learn post
          </Link>
        </div>
      </div>

      <PostsTable rows={rows} />

      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
    </div>
  );
}
