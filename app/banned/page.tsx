import type { Metadata } from "next";
import { BannedContent } from "./BannedContent";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

export default function BannedPage() {
  return <BannedContent />;
}
