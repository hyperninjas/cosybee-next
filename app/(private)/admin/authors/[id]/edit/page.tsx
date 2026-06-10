import { notFound } from "next/navigation";
import AuthorForm from "../../AuthorForm";
import { adminApi } from "../../../lib/api";

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const author = await adminApi.getAuthor(id);
  if (!author) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Edit author</h1>
      <AuthorForm author={author} />
    </div>
  );
}
