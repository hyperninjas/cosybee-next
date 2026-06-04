import type { Metadata } from "next";
import BlogHero from "../components/sections/blog/BlogHero";
import BlogBrowse from "../components/sections/blog/BlogBrowse";
import { getArticles, getFeatured, getCategoryNames } from "../lib/articles";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structured-data";
import learnCover from "@/public/Cover/energiebee-learn-cover.png";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Guides, tutorials, and energy-saving tips from the EnergieBee team.",
  alternates: { canonical: "/learn" },
  openGraph: {
    url: "/learn",
    title: "Learn — EnergieBee",
    description:
      "Guides, tutorials, and energy-saving tips from the EnergieBee team.",
  },
};

export default async function LearnPage({
  searchParams,
}: PageProps<"/learn">) {
  const { tag } = await searchParams;
  const [articles, featured, categories] = await Promise.all([
    getArticles("learn"),
    getFeatured("learn"),
    getCategoryNames("learn"),
  ]);

  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
        ])}
      />
      <BlogHero
        title="Learn"
        description="Guides, tutorials, and energy-saving tips from the EnergieBee team."
        bgImage={learnCover}
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
