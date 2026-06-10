import { notFound } from "next/navigation";
import TagForm from "../../TagForm";
import { adminApi } from "../../../lib/api";

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tag = await adminApi.getTag(id);
  if (!tag) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Edit tag</h1>
      <TagForm tag={tag} />
    </div>
  );
}
