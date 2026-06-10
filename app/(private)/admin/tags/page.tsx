import { connection } from "next/server";
import { adminApi } from "../lib/api";
import { TagsList } from "./TagsList";

export default async function AdminTagsPage() {
  await connection();
  const tags = await adminApi.getAllTags();

  return (
    <div className="space-y-6">
      <TagsList tags={tags} />
    </div>
  );
}
