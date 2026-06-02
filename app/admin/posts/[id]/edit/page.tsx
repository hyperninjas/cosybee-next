import { notFound } from "next/navigation";
import PostForm, { type FormPost } from "@/app/admin/posts/PostForm";
import {
  getPost,
  getAllCategories,
  getAllTags,
  getInternalRoutes,
} from "@/app/admin/lib/queries";

function ensureTagsArray(tags: string[] | string): string[] {
  if (Array.isArray(tags)) return tags;
  try {
    const v = JSON.parse(tags);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tags, routes] = await Promise.all([
    getPost(id),
    getAllCategories(),
    getAllTags(),
    getInternalRoutes(),
  ]);
  if (!post) notFound();

  const formPost: FormPost = {
    id: post.id,
    blog: post.blog,
    slug: post.slug,
    title: post.title,
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    description: post.description,
    tags: ensureTagsArray(post.tags),
    category: post.category,
    readTime: typeof post.readTime === "number" ? `${post.readTime} min read` : post.readTime,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    lede: post.lede ?? "",
    ctaLabel: post.ctaLabel ?? "",
    ctaHref: post.ctaHref ?? "",
    ctaExternal: post.ctaExternal,
    authorName: post.authorName,
    authorDate: post.authorDate,
    carouselIntro: post.carouselIntro ?? "",
    carouselBody: post.carouselBody ?? "",
    featured: post.featured,
    status: post.status,
    contentJson: typeof post.contentJson === "string"
      ? post.contentJson
      : JSON.stringify(post.contentJson),
  };

  return (
    <PostForm
      post={formPost}
      categorySuggestions={categories}
      tagSuggestions={tags}
      internalRoutes={routes}
    />
  );
}
