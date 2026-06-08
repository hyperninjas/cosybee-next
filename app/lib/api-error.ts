/**
 * Uniform backend error contract. Every failed request returns:
 *   { status, code, message, requestId }
 * ALWAYS branch on `code` — `message` is for display only.
 */
export type AuthErrorCode =
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_BANNED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | (string & {});

export interface ApiError {
  status: number;
  code: AuthErrorCode;
  message: string;
  requestId?: string;
}

/** Parse a fetch Response into the uniform ApiError shape (graceful fallback). */
export async function parseApiError(res: Response): Promise<ApiError> {
  let body: Partial<ApiError> = {};
  try {
    body = (await res.json()) as Partial<ApiError>;
  } catch {
    /* non-JSON body */
  }
  return {
    status: res.status,
    code: body.code ?? (res.status === 401 ? "UNAUTHORIZED" : "ERROR"),
    message: body.message ?? `Request failed (${res.status})`,
    requestId: body.requestId,
  };
}

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search;
}

function go(url: string): void {
  if (typeof window !== "undefined") window.location.assign(url);
}

/**
 * Route the cross-cutting auth codes to the right place. Returns `true` when it
 * handled the error (and is navigating away), so callers can stop. Anything
 * else returns `false` — the caller shows `message`.
 */
export async function handleAuthError(code: string | undefined): Promise<boolean> {
  switch (code) {
    case "EMAIL_NOT_VERIFIED":
      go(`/verify-email?redirect=${encodeURIComponent(currentPath())}`);
      return true;
    case "ACCOUNT_BANNED":
      try {
        // Lazy import keeps this module safe to import in server-only code.
        const { authClient } = await import("./auth-client");
        await authClient.signOut();
      } catch {
        /* ignore */
      }
      go("/banned");
      return true;
    case "UNAUTHORIZED":
      go(`/login?redirect=${encodeURIComponent(currentPath())}`);
      return true;
    default:
      return false;
  }
}

/**
 * Sensitive actions (delete-account, disable-2FA, change-password/email) need a
 * session younger than the backend's `freshAge` (1 day). When too old the
 * backend rejects with a "fresh session" error — detect it so the UI can
 * prompt a re-login.
 */
export function isFreshSessionError(
  err: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!err) return false;
  return (
    err.code === "SESSION_NOT_FRESH" ||
    (err.message ?? "").toLowerCase().includes("fresh")
  );
}
