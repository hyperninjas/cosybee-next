import { AppLink as Link } from "@/app/components/ui/AppLink";
import { Suspense } from "react";
import { connection } from "next/server";
import { listPosts } from "./lib/queries";
import PostsTable, { type Row } from "./PostsTable";
import SavedToast from "./SavedToast";

export default async function AdminDashboard() {
  // Render per-request: stop prerendering before the live, no-store fetch in
  // listPosts() so `next build` doesn't try to reach the backend while
  // collecting page data (this route is dynamic anyway).
  await connection();
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
    updatedAt: p.updatedAt,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Posts</h1>
          <p className="mt-1 text-sm text-muted">{posts.length} total</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/posts/new?blog=hive"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent hover:shadow-md"
          >
            + New Hive post
          </Link>
          <Link
            href="/admin/posts/new?blog=learn"
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-foreground hover:shadow-md"
          >
            + New Learn post
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
