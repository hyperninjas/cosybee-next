import type { Metadata } from "next";
import BlogNotFound from "../components/sections/blog/BlogNotFound";

export const metadata: Metadata = {
  title: "Article not found",
  description:
    "The article you're looking for doesn't exist or has been moved.",
  robots: { index: false, follow: false },
};

export default function LearnNotFound() {
  return <BlogNotFound basePath="/learn" backLabel="Back to Learn" />;
}
