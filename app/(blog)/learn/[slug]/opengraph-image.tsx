import { getArticleBySlug } from "@/app/lib/articles";
import { renderArticleOg, OG_SIZE } from "@/app/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "energiebee — Learn";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);
  return renderArticleOg({
    title: article?.title ?? "Learn",
    category: article?.category?.name ?? "energiebee",
    blog: "learn",
    coverImage: article?.coverImage,
  });
}
