import { notFound } from "next/navigation";
import PostForm, { type FormPost } from "@/app/(private)/admin/posts/PostForm";
import {
  getPost,
  getAllCategories,
  getAllTags,
  getAuthors,
  getInternalRoutes,
} from "@/app/(private)/admin/lib/queries";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tags, authors, routes] = await Promise.all([
    getPost(id),
    getAllCategories(),
    getAllTags(),
    getAuthors(),
    getInternalRoutes(),
  ]);
  if (!post) notFound();

  // Extract tag names for autocomplete suggestions
  const tagSuggestions = tags.map((t) => t.name);

  // Map backend post to form shape
  const formPost: FormPost = {
    id: post.id,
    blog: post.blog,
    slug: post.slug,
    title: post.title,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    description: post.description,
    lede: post.lede,

    // Taxonomy (full objects)
    author: post.author,
    category: post.category,
    tags: post.tags ?? [],

    // Media
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,

    // Display
    readTime: post.readTime,
    authorDate: post.authorDate,

    // Featured/Carousel
    featured: post.featured,
    carouselIntro: post.carouselIntro,
    carouselBody: post.carouselBody,

    // CTA
    ctaLabel: post.ctaLabel,
    ctaHref: post.ctaHref,
    ctaExternal: post.ctaExternal,

    // Status
    status: post.status,

    // Content
    contentJson: post.contentJson,
  };

  return (
    <PostForm
      post={formPost}
      categories={categories}
      tagSuggestions={tagSuggestions}
      authors={authors}
      internalRoutes={routes}
    />
  );
}
