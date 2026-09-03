import { notFound } from "next/navigation";
import { connection } from "next/server";
import PostForm, { type FormPost } from "@/app/(private)/admin/posts/PostForm";
import {
  getPost,
  getAllCategories,
  getAllTags,
  getAuthors,
  getLinkTargets,
} from "@/app/(private)/admin/lib/queries";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Render per-request so fresh tags/categories/authors created in other
  // admin pages show up in this form's suggestions without a hard reload.
  await connection();
  const { id } = await params;
  const [post, categories, tags, authors, linkTargets] = await Promise.all([
    getPost(id),
    getAllCategories(),
    getAllTags(),
    getAuthors(),
    getLinkTargets(),
  ]);
  if (!post) notFound();

  // Extract tag names for autocomplete suggestions
  const tagSuggestions = tags.map((t) => t.name);

  // Unpublished edits, laid over the live values.
  //
  // Without this the editor would open on the LIVE article and the next
  // autosave would overwrite the staged patch with it — quietly throwing away
  // work that had been saved successfully. Autosave only makes sense if
  // reopening the post resumes where the author left off.
  //
  // Only the fields autosave actually writes are merged; everything else
  // (cover, taxonomy, flags) is never staged and comes from the live row.
  const staged = (post.draft ?? {}) as Partial<{
    title: string;
    description: string;
    lede: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    contentJson: Record<string, unknown>;
  }>;

  // Map backend post to form shape
  const formPost: FormPost = {
    id: post.id,
    blog: post.blog,
    slug: post.slug,
    title: staged.title ?? post.title,
    seoTitle: staged.seoTitle ?? post.seoTitle,
    seoDescription: staged.seoDescription ?? post.seoDescription,
    description: staged.description ?? post.description,
    lede: staged.lede ?? post.lede,

    // Taxonomy (full objects)
    author: post.author,
    category: post.category,
    // Non-null when the live post is holding edits nobody has made live yet.
    draftUpdatedAt: post.draftUpdatedAt ?? null,
    tags: post.tags ?? [],

    // Media
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    coverImageTitle: post.coverImageTitle ?? null,
    coverImageCaption: post.coverImageCaption ?? null,
    coverImageCredit: post.coverImageCredit ?? null,

    // SEO / social
    ogImage: post.ogImage ?? null,
    ogImageAlt: post.ogImageAlt ?? null,
    canonicalUrl: post.canonicalUrl ?? null,
    noindex: post.noindex ?? false,

    // Display
    readTime: post.readTime,
    authorDate: post.authorDate,

    // Featured/Carousel
    featured: post.featured,
    homeFeatured: post.homeFeatured,
    carouselIntro: post.carouselIntro,
    carouselBody: post.carouselBody,

    // CTA
    ctaLabel: post.ctaLabel,
    ctaHref: post.ctaHref,
    ctaExternal: post.ctaExternal,

    // Status / scheduling
    status: post.status,
    publishedAt: post.publishedAt ?? null,

    // Content
    // The body is the field autosave writes most — staged wins.
    contentJson: staged.contentJson ?? post.contentJson,
  };

  return (
    <PostForm
      post={formPost}
      categories={categories}
      tagSuggestions={tagSuggestions}
      authors={authors}
      linkTargets={linkTargets}
    />
  );
}
