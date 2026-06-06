import type { Metadata } from "next";
import BlogNotFound from "@/app/components/sections/blog/BlogNotFound";

export const metadata: Metadata = {
  title: "Article not found",
  description:
    "The article you're looking for doesn't exist or has been moved.",
  robots: { index: false, follow: false },
};

export default function HiveNotFound() {
  return <BlogNotFound basePath="/hive" backLabel="Back to Hive" />;
}
