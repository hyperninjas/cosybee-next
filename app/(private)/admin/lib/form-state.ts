// Shared form-action state. Kept out of the "use server" actions file,
// which may only export async functions (not objects/types).

export type SaveState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const initialSaveState: SaveState = { ok: false };
