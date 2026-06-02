import { notFound } from "next/navigation";
import PostForm, { type FormPost } from "@/app/admin/posts/PostForm";
import {
  getPost,
  getAllCategories,
  getAllTags,
  getInternalRoutes,
} from "@/app/admin/lib/queries";

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export default async function EditPostPage({
  params,
}: PageProps<"/admin/posts/[id]/edit">) {
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
    tags: parseTags(post.tags),
    category: post.category,
    readTime: post.readTime,
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
    contentJson: post.contentJson,
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
