import type { Metadata } from "next";
import Link from "next/link";

// Keep the admin panel out of search results.
export const metadata: Metadata = {
  title: "Admin — energiebee",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black">
      <header className="border-b border-[#ECECEC] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-lg font-extrabold">
            energiebee <span className="text-[#FF8A7A]">admin</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/hive" className="text-[#545454] hover:text-black">
              View Hive
            </Link>
            <Link href="/learn" className="text-[#545454] hover:text-black">
              View Learn
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
