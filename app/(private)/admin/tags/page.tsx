import Link from "next/link";
import { connection } from "next/server";
import { buttonVariants } from "@heroui/react";
import { adminApi } from "../lib/api";
import { deleteTagAction } from "../taxonomy/actions";

export default async function AdminTagsPage() {
  await connection();
  const tags = await adminApi.getAllTags();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Tags</h1>
          <p className="mt-1 text-sm text-muted">{tags.length} total</p>
        </div>
        <Link
          href="/admin/tags/new"
          className={buttonVariants({ variant: "primary" })}
        >
          + New tag
        </Link>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No tags yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {tags.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-background"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  #{t.name}
                </div>
                <div className="truncate text-xs text-muted">
                  /tag/{t.slug}
                  {t.description ? ` · ${t.description}` : ""}
                </div>
              </div>
              <Link
                href={`/admin/tags/${t.id}/edit`}
                className="text-sm font-medium text-accent transition-colors hover:underline"
              >
                Edit
              </Link>
              <form action={deleteTagAction}>
                <input type="hidden" name="id" value={t.id} />
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
