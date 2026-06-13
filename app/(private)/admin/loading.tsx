import { Spinner } from "@heroui/react";

/**
 * Admin route loading fallback. Rendered inside the admin layout (so the
 * header + breadcrumbs stay visible) while a segment's server work runs —
 * the dashboard's post list, or any sub-page's data fetch. Applies to every
 * admin page that doesn't define its own loading.tsx.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" aria-label="Loading" />
    </div>
  );
}
