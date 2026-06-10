// Shared form-action state. Kept out of the "use server" actions file,
// which may only export async functions (not objects/types).

export type SaveState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * A save state that also carries the just-saved entity. Lets callers
 * (e.g. an "add author from the post editor" modal) react to the
 * server's returned record — auto-select it, prime an avatar preview,
 * etc — without an extra fetch.
 */
export type EntitySaveState<T> = SaveState & { entity?: T };

export const initialSaveState: SaveState = { ok: false };
