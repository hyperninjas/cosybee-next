import { connection } from "next/server";
import { adminApi } from "../lib/api";
import { CategoriesList } from "./CategoriesList";

export default async function AdminCategoriesPage() {
  await connection();
  const categories = await adminApi.getAllCategories();

  return (
    <div className="space-y-6">
      <CategoriesList categories={categories} />
    </div>
  );
}
