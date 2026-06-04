import PostForm from "@/app/admin/posts/PostForm";
import {
  getAllCategories,
  getAllTags,
  getAuthors,
  getInternalRoutes,
} from "@/app/admin/lib/queries";

export default async function NewPostPage({
  searchParams,
}: PageProps<"/admin/posts/new">) {
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
