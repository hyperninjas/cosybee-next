import type { Metadata } from "next";
import HiveBrowse from "../components/sections/hive/HiveBrowse";
import HiveHero from "../components/sections/hive/HiveHero";

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
      <HiveBrowse />
    </main>
  );
}
