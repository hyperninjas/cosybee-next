import PostForm from "@/app/admin/posts/PostForm";
import {
  getAllCategories,
  getAllTags,
  getInternalRoutes,
} from "@/app/admin/lib/queries";

export default async function NewPostPage({
  searchParams,
}: PageProps<"/admin/posts/new">) {
  const { blog } = await searchParams;
  const defaultBlog = blog === "learn" ? "learn" : "hive";
  const [categories, tags, routes] = await Promise.all([
    getAllCategories(),
    getAllTags(),
    getInternalRoutes(),
  ]);
  return (
    <PostForm
      defaultBlog={defaultBlog}
      categorySuggestions={categories}
      tagSuggestions={tags}
      internalRoutes={routes}
    />
  );
}
