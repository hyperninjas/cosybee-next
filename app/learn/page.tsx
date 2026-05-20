import type { Metadata } from "next";
import BlogHero from "../components/sections/blog/BlogHero";
import BlogBrowse from "../components/sections/blog/BlogBrowse";
import {
  LEARN_ARTICLES,
  LEARN_CATEGORIES,
  getFeaturedLearnArticles,
} from "../lib/learn-articles";

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

export default function LearnPage() {
  return (
    <main className="flex-1">
      <BlogHero
        title="Learn"
        description="Guides, tutorials, and energy-saving tips from the energiebee team."
      />
      <BlogBrowse
        articles={LEARN_ARTICLES}
        featured={getFeaturedLearnArticles()}
        categories={LEARN_CATEGORIES}
        basePath="/learn"
      />
    </main>
  );
}
