import type { Metadata } from "next";
import NotFoundView from "@/app/components/sections/NotFoundView";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "This page has moved or been tidied away. Nothing's broken — here's the way back to solar, smart heating and the Hive.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <NotFoundView
      title="Well, this is a quiet corner of the hive."
      lead={
        "The page you wanted isn't available. \n Let's find you somewhere warmer."
      }
    />
  );
}
