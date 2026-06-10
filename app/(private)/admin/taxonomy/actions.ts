"use server";

import { revalidatePath } from "next/cache";
import { slugify } from "@/app/lib/slug";
import {
  adminApi,
  type AuthorInput,
  type CategoryInput,
  type TagInput,
} from "../lib/api";
import type { EntitySaveState, SaveState } from "../lib/form-state";
import type { Author, Category } from "@/app/lib/article-types";
import { assertAdmin } from "../lib/auth";

function str(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}

function optStr(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}

function optInt(form: FormData, key: string): number | null {
  const v = str(form, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------
// Authors
// ---------------------------------------------------------------

export async function saveAuthor(
  _prev: EntitySaveState<Author>,
  formData: FormData,
): Promise<EntitySaveState<Author>> {
  await assertAdmin();

  const id = optStr(formData, "id");
  const name = str(formData, "name");
  if (!name) {
    return {
      ok: false,
      error: "Add a name to save the author.",
      fieldErrors: { name: "Name is required." },
    };
  }

  const input: AuthorInput = {
    name,
    slug: optStr(formData, "slug") ?? undefined,
    avatarUrl: optStr(formData, "avatarUrl"),
    avatarAlt: optStr(formData, "avatarAlt"),
    avatarWidth: optInt(formData, "avatarWidth"),
    avatarHeight: optInt(formData, "avatarHeight"),
    bio: optStr(formData, "bio"),
    role: optStr(formData, "role"),
    email: optStr(formData, "email"),
    website: optStr(formData, "website"),
    twitter: optStr(formData, "twitter"),
    linkedin: optStr(formData, "linkedin"),
    github: optStr(formData, "github"),
  };

  let entity: Author;
  try {
    entity = id
      ? await adminApi.updateAuthor(id, input)
      : await adminApi.createAuthor(input);
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin/authors");
  return { ok: true, entity };
}

/**
 * Delete actions return SaveState so the calling dialog can detect the
 * outcome via useActionState and close itself / surface the error inline.
 * The shape mirrors saveAuthor / saveCategory / saveTag.
 */
export async function deleteAuthorAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing author id." };
  try {
    await adminApi.deleteAuthor(id);
  } catch (e) {
    return { ok: false, error: `Could not delete: ${(e as Error).message}` };
  }
  revalidatePath("/admin/authors");
  return { ok: true };
}

// ---------------------------------------------------------------
// Categories
// ---------------------------------------------------------------

export async function saveCategory(
  _prev: EntitySaveState<Category>,
  formData: FormData,
): Promise<EntitySaveState<Category>> {
  await assertAdmin();

  const id = optStr(formData, "id");
  const blog = str(formData, "blog");
  const name = str(formData, "name");
  if (!name) {
    return {
      ok: false,
      error: "Add a name to save the category.",
      fieldErrors: { name: "Name is required." },
    };
  }
  if (blog !== "hive" && blog !== "learn") {
    return {
      ok: false,
      error: "Pick a blog (hive or learn) before saving.",
      fieldErrors: { blog: "Required." },
    };
  }

  const input: CategoryInput = {
    blog,
    name,
    slug: optStr(formData, "slug") ?? slugify(name),
    description: optStr(formData, "description"),
    seoTitle: optStr(formData, "seoTitle"),
    seoDescription: optStr(formData, "seoDescription"),
    iconUrl: optStr(formData, "iconUrl"),
    color: optStr(formData, "color"),
  };

  let entity: Category;
  try {
    entity = id
      ? await adminApi.updateCategory(id, input)
      : await adminApi.createCategory(input);
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin/categories");
  return { ok: true, entity };
}

export async function deleteCategoryAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing category id." };
  try {
    await adminApi.deleteCategory(id);
  } catch (e) {
    return { ok: false, error: `Could not delete: ${(e as Error).message}` };
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

// ---------------------------------------------------------------
// Tags
// ---------------------------------------------------------------

export async function saveTag(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();

  const id = optStr(formData, "id");
  const name = str(formData, "name");
  if (!name) {
    return {
      ok: false,
      error: "Add a name to save the tag.",
      fieldErrors: { name: "Name is required." },
    };
  }

  // Rename keeps the existing slug stable unless the admin explicitly
  // edits it — preserves any /tag/<slug> URLs already in the wild.
  const input: TagInput = {
    name,
    slug: optStr(formData, "slug") ?? undefined,
    description: optStr(formData, "description"),
  };

  try {
    if (id) {
      await adminApi.updateTag(id, input);
    } else {
      await adminApi.createTag(input);
    }
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin/tags");
  return { ok: true };
}

export async function deleteTagAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing tag id." };
  try {
    await adminApi.deleteTag(id);
  } catch (e) {
    return { ok: false, error: `Could not delete: ${(e as Error).message}` };
  }
  revalidatePath("/admin/tags");
  return { ok: true };
}
