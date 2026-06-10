import Link from "next/link";
import { connection } from "next/server";
import { buttonVariants } from "@heroui/react";
import { adminApi } from "../lib/api";
import { deleteAuthorAction } from "../taxonomy/actions";
import { AppAvatar } from "@/app/components/ui/AppAvatar";

export default async function AdminAuthorsPage() {
  await connection();
  const authors = await adminApi.getAuthors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Authors</h1>
          <p className="mt-1 text-sm text-muted">{authors.length} total</p>
        </div>
        <Link
          href="/admin/authors/new"
          className={buttonVariants({ variant: "primary" })}
        >
          + New author
        </Link>
      </div>

      {authors.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No authors yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {authors.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-background"
            >
              <AppAvatar
                src={a.avatarUrl}
                name={a.name}
                size="md"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {a.name}
                </div>
                <div className="truncate text-xs text-muted">
                  {a.role ?? "—"} · /{a.slug}
                </div>
              </div>
              <Link
                href={`/admin/authors/${a.id}/edit`}
                className="text-sm font-medium text-accent transition-colors hover:underline"
              >
                Edit
              </Link>
              <form action={deleteAuthorAction}>
                <input type="hidden" name="id" value={a.id} />
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
