"use client";

import { AppLink as Link } from "@/app/components/ui/AppLink";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
];

/** Tab-style navigation between the account settings pages. */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
