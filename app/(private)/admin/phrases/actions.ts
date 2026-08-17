"use server";

import { revalidatePath } from "next/cache";
import { revalidateContent } from "@/app/lib/revalidate";
import { adminApi, type PhraseInput } from "../lib/api";
import type { SaveState } from "../lib/form-state";
import { assertAdmin } from "../lib/auth";

function str(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}

function optStr(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}

/**
 * Refresh everything a phrase edit can be visible in.
 *
 * `revalidateContent()` drops the tagged read behind `getPhrases()`, but the
 * footer is rendered by the ROOT LAYOUT — so every prerendered page is holding
 * its own copy of the old phrase list, and invalidating the data alone would
 * leave them all stale. `revalidatePath("/", "layout")` expires that whole
 * tree, which is the only honest way to make a footer edit sitewide.
 */
function revalidateFooter(): void {
  revalidateContent();
  revalidatePath("/admin/phrases");
  revalidatePath("/", "layout");
}

/**
 * Create or update one phrase. `id` present in the form → update.
 *
 * The article link is validated here as well as on the backend: this is the
 * field that can turn every page's footer into a 404, so a typo caught before
 * the request is worth the duplication.
 */
export async function savePhrase(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();

  const id = optStr(formData, "id");
  const quote = str(formData, "quote");
  const author = str(formData, "author");
  const articlePath = str(formData, "articlePath");

  const fieldErrors: Record<string, string> = {};
  if (!quote) fieldErrors.quote = "A quote is required.";
  if (!author) fieldErrors.author = "Who said it?";
  if (!articlePath) {
    fieldErrors.articlePath = "Pick the page this phrase links to.";
  } else if (!articlePath.startsWith("/") || articlePath.startsWith("//")) {
    fieldErrors.articlePath =
      "Must be a page on this site, starting with “/”.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }

  const input: PhraseInput = {
    quote,
    author,
    articlePath,
    articleLabel: optStr(formData, "articleLabel"),
    isActive: str(formData, "isActive") === "on",
  };

  try {
    if (id) {
      await adminApi.updatePhrase(id, input);
    } else {
      await adminApi.createPhrase(input);
    }
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidateFooter();
  return { ok: true };
}

export async function deletePhraseAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing phrase id." };
  try {
    await adminApi.deletePhrase(id);
  } catch (e) {
    return { ok: false, error: `Could not delete: ${(e as Error).message}` };
  }
  revalidateFooter();
  return { ok: true };
}

/**
 * Persist a new rotation order. Takes the full list of ids as the client shows
 * it, rather than "move X up" — see the backend's reorder endpoint for why.
 *
 * Called directly (not through a form), so it takes the ids as an argument and
 * returns SaveState for the caller to surface.
 */
export async function reorderPhrasesAction(ids: string[]): Promise<SaveState> {
  await assertAdmin();
  if (ids.length === 0) return { ok: false, error: "Nothing to reorder." };
  try {
    await adminApi.reorderPhrases(ids);
  } catch (e) {
    return { ok: false, error: `Could not reorder: ${(e as Error).message}` };
  }
  revalidateFooter();
  return { ok: true };
}

/** Toggle one phrase in or out of the rotation without opening the form. */
export async function togglePhraseActiveAction(
  id: string,
  isActive: boolean,
): Promise<SaveState> {
  await assertAdmin();
  try {
    await adminApi.updatePhrase(id, { isActive });
  } catch (e) {
    return { ok: false, error: `Could not update: ${(e as Error).message}` };
  }
  revalidateFooter();
  return { ok: true };
}
