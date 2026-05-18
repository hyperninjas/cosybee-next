import type { Metadata } from "next";
import HiveFeatured from "../components/sections/hive/HiveFeatured";
import HiveFilterBar from "../components/sections/hive/HiveFilterBar";
import HiveHero from "../components/sections/hive/HiveHero";
import HiveLatestArticles from "../components/sections/hive/HiveLatestArticles";
import Divider from "../components/ui/Divider";

export const metadata: Metadata = {
  title: "The Hive",
  description:
    "Insights, stories, and expert advice on sustainable energy solutions for modern homes.",
  alternates: { canonical: "/hive" },
  openGraph: {
    url: "/hive",
    title: "The Hive — energiebee",
    description:
      "Insights, stories, and expert advice on sustainable energy solutions for modern homes.",
  },
};

export default function HivePage() {
  return (
    <main className="flex-1">
      <HiveHero />
      <HiveFilterBar />
      <Divider />
      <HiveFeatured />
      <HiveLatestArticles />
    </main>
  );
}
