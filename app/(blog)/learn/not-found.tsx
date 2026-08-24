import type { Metadata } from "next";
import BlogNotFound from "@/app/components/sections/blog/BlogNotFound";

export const metadata: Metadata = {
  title: "Article not found",
  description:
    "This article has been retired or renamed. Browse the latest Learn articles or search every EnergieBee guide by keyword.",
  robots: { index: false, follow: false },
};

export default function LearnNotFound() {
  return <BlogNotFound basePath="/learn" backLabel="Back to Learn" />;
}
