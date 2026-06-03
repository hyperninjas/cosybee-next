import type { Metadata } from "next";
import BlogHero from "../components/sections/blog/BlogHero";
import BlogBrowse from "../components/sections/blog/BlogBrowse";
import { getArticles, getFeatured, getCategories } from "../lib/articles";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structured-data";

export const metadata: Metadata = {
  title: "The Hive",
  description:
    "Insights, stories, and expert advice on sustainable energy solutions for modern homes.",
  alternates: { canonical: "/hive" },
  openGraph: {
    url: "/hive",
    title: "The Hive — EnergieBee",
    description:
      "Insights, stories, and expert advice on sustainable energy solutions for modern homes.",
  },
};

export default async function HivePage({
  searchParams,
}: PageProps<"/hive">) {
  const { tag } = await searchParams;
  const [articles, featured, categories] = await Promise.all([
    getArticles("hive"),
    getFeatured("hive"),
    getCategories("hive"),
  ]);

  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "The Hive", path: "/hive" },
        ])}
      />
      <BlogHero
        title="The Hive"
        description="Insights, stories, and expert advice on sustainable energy solutions for modern homes."
      />
      <BlogBrowse
        articles={articles}
        featured={featured}
        categories={categories}
        basePath="/hive"
        initialTag={typeof tag === "string" ? tag : undefined}
      />
    </main>
  );
}
