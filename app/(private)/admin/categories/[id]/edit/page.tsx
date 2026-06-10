import { notFound } from "next/navigation";
import CategoryForm from "../../CategoryForm";
import { adminApi } from "../../../lib/api";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await adminApi.getCategory(id);
  if (!category) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Edit category</h1>
      <CategoryForm category={category} />
    </div>
  );
}
