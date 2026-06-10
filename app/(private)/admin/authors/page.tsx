import { connection } from "next/server";
import { adminApi } from "../lib/api";
import { AuthorsList } from "./AuthorsList";

export default async function AdminAuthorsPage() {
  // Render per-request — the live, no-store fetch in adminApi would
  // otherwise be invoked during `next build` static collection.
  await connection();
  const authors = await adminApi.getAuthors();

  return (
    <div className="space-y-6">
      <AuthorsList authors={authors} />
    </div>
  );
}
