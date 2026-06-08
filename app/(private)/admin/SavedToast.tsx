"use client";

import { useEffect } from "react";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Transient success toast shown after savePost redirects with
 * `?saved=blog/slug&status=…`. Visibility derives from the query; the
 * effect just clears it after a few seconds (which unmounts the toast).
 */
export default function SavedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const saved = params.get("saved");
  const published = params.get("status") === "PUBLISHED";

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => router.replace("/admin"), 4000);
    return () => clearTimeout(t);
  }, [saved, router]);

  if (!saved) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-white shadow-lg">
      <span className="font-semibold text-[#9be8ad]">
        {published ? "Published" : "Saved"} ✓
      </span>
      {published && (
        <Link
          href={`/${saved}`}
          target="_blank"
          className="font-semibold text-danger underline"
        >
          View post
        </Link>
      )}
    </div>
  );
}
