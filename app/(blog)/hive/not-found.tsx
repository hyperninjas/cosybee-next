import type { Metadata } from "next";
import BlogNotFound from "@/app/components/sections/blog/BlogNotFound";

export const metadata: Metadata = {
  title: "Article not found",
  description:
    "This article has been retired or renamed. Browse the latest Hive articles or search every EnergieBee guide by keyword.",
  robots: { index: false, follow: false },
};

export default function HiveNotFound() {
  return <BlogNotFound basePath="/hive" backLabel="Back to the Hive" />;
}
