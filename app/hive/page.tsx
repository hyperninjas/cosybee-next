import type { Metadata } from "next";
import BlogHero from "../components/sections/blog/BlogHero";
import BlogBrowse from "../components/sections/blog/BlogBrowse";
import {
  HIVE_ARTICLES,
  HIVE_CATEGORIES,
  getFeaturedArticles,
} from "../lib/hive-articles";

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

export default function HivePage() {
  return (
    <main className="flex-1">
      <BlogHero
        title="The Hive"
        description="Insights, stories, and expert advice on sustainable energy solutions for modern homes."
      />
      <BlogBrowse
        articles={HIVE_ARTICLES}
        featured={getFeaturedArticles()}
        categories={HIVE_CATEGORIES}
        basePath="/hive"
      />
    </main>
  );
}
