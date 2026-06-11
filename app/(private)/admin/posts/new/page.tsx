import { connection } from "next/server";
import PostForm from "@/app/(private)/admin/posts/PostForm";
import {
  getAllCategories,
  getAllTags,
  getAuthors,
  getInternalRoutes,
} from "@/app/(private)/admin/lib/queries";

export default async function NewPostPage({
  searchParams,
}: PageProps<"/admin/posts/new">) {
  // Render per-request so fresh tags/categories/authors created in other
  // admin pages show up in this form's suggestions without a hard reload.
  await connection();
  const { blog } = await searchParams;
  const defaultBlog = blog === "learn" ? "learn" : "hive";
  const [categories, tags, authors, routes] = await Promise.all([
    getAllCategories(),
    getAllTags(),
    getAuthors(),
    getInternalRoutes(),
  ]);

  // Extract tag names for autocomplete suggestions
  const tagSuggestions = tags.map((t) => t.name);

  return (
    <PostForm
      defaultBlog={defaultBlog}
      categories={categories}
      tagSuggestions={tagSuggestions}
      authors={authors}
      internalRoutes={routes}
    />
  );
}
