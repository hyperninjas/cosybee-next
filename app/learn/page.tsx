import type { Metadata } from "next";
import BlogHero from "../components/sections/blog/BlogHero";
import BlogBrowse from "../components/sections/blog/BlogBrowse";
import { getArticles, getFeatured, getCategories } from "../lib/articles";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Guides, tutorials, and energy-saving tips from the energiebee team.",
  alternates: { canonical: "/learn" },
  openGraph: {
    url: "/learn",
    title: "Learn — energiebee",
    description:
      "Guides, tutorials, and energy-saving tips from the energiebee team.",
  },
};

export default async function LearnPage({
  searchParams,
}: PageProps<"/learn">) {
  const { tag } = await searchParams;
  const [articles, featured, categories] = await Promise.all([
    getArticles("learn"),
    getFeatured("learn"),
    getCategories("learn"),
  ]);

  return (
    <main className="flex-1">
      <BlogHero
        title="Learn"
        description="Guides, tutorials, and energy-saving tips from the energiebee team."
      />
      <BlogBrowse
        articles={articles}
        featured={featured}
        categories={categories}
        basePath="/learn"
        initialTag={typeof tag === "string" ? tag : undefined}
      />
    </main>
  );
}
