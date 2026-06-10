import Link from "next/link";
import { connection } from "next/server";
import { buttonVariants } from "@heroui/react";
import { adminApi } from "../lib/api";
import { deleteCategoryAction } from "../taxonomy/actions";

export default async function AdminCategoriesPage() {
  await connection();
  const categories = await adminApi.getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Categories</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} total</p>
        </div>
        <Link
          href="/admin/categories/new"
          className={buttonVariants({ variant: "primary" })}
        >
          + New category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No categories yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-background"
            >
              {c.color && (
                <span
                  aria-hidden
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {c.name}
                </div>
                <div className="truncate text-xs text-muted">
                  {c.blog} · /{c.slug}
                </div>
              </div>
              <Link
                href={`/admin/categories/${c.id}/edit`}
                className="text-sm font-medium text-accent transition-colors hover:underline"
              >
                Edit
              </Link>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="text-sm font-medium text-danger transition-colors hover:underline"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
