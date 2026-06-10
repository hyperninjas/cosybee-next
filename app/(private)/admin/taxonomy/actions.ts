"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/app/lib/slug";
import {
  adminApi,
  type AuthorInput,
  type CategoryInput,
  type TagInput,
} from "../lib/api";
import type { SaveState } from "../lib/form-state";
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
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
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

  try {
    if (id) {
      await adminApi.updateAuthor(id, input);
    } else {
      await adminApi.createAuthor(input);
    }
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin/authors");
  redirect("/admin/authors");
}

export async function deleteAuthorAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  try {
    await adminApi.deleteAuthor(id);
  } catch (e) {
    console.error("[deleteAuthor]", e);
  }
  revalidatePath("/admin/authors");
}

/**
 * Patch just the avatar fields on an existing author. Lets the in-place
 * EditableAvatar in the post editor update an existing author's photo
 * without leaving the editor (or losing the post-form state to a redirect).
 */
export async function updateAuthorAvatar(
  authorId: string,
  avatarUrl: string,
  avatarAlt?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  if (!authorId) return { ok: false, error: "Missing author id." };
  try {
    await adminApi.updateAuthor(authorId, {
      avatarUrl,
      avatarAlt: avatarAlt ?? null,
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin/authors");
  revalidatePath("/admin/posts");
  return { ok: true };
}

// ---------------------------------------------------------------
// Categories
// ---------------------------------------------------------------

export async function saveCategory(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
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

  try {
    if (id) {
      await adminApi.updateCategory(id, input);
    } else {
      await adminApi.createCategory(input);
    }
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  try {
    await adminApi.deleteCategory(id);
  } catch (e) {
    console.error("[deleteCategory]", e);
  }
  revalidatePath("/admin/categories");
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
  redirect("/admin/tags");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  try {
    await adminApi.deleteTag(id);
  } catch (e) {
    console.error("[deleteTag]", e);
  }
  revalidatePath("/admin/tags");
}
