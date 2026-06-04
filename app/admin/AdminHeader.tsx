"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

const authPaths = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export function AdminHeader() {
  const pathname = usePathname();

  // Hide header on auth pages
  if (authPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return (
    <header className="border-b border-[#ECECEC] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/admin" className="text-lg font-extrabold">
          energiebee <span className="text-[#FF8A7A]">admin</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/admin/manage-users" className="text-[#545454] hover:text-black">
            Users
          </Link>
          <Link href="/hive" className="text-[#545454] hover:text-black">
            View Hive
          </Link>
          <Link href="/learn" className="text-[#545454] hover:text-black">
            View Learn
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
