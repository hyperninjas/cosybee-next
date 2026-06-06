"use client";

import { useEffect, useState } from "react";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

interface SessionRow {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

/** Best-effort human label for a session's device/browser. */
function deviceLabel(ua?: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Safari/.test(ua)
        ? "Safari"
        : /Firefox/.test(ua)
          ? "Firefox"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS|Macintosh/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iOS/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} on ${os}` : browser;
}

export function SessionsCard({ currentToken }: { currentToken?: string }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Applies a sessions fetch result to state. Used by both the initial load
  // (in the effect's async callback) and the post-action reloads.
  function applyResult(
    data: unknown,
    err: { message?: string } | null,
  ) {
    if (err) setError(err.message || "Could not load sessions.");
    else setSessions((data as SessionRow[]) ?? []);
    setLoading(false);
  }

  // Initial load. setState happens only inside the async callback (not
  // synchronously in the effect body), so it doesn't trigger cascading renders.
  useEffect(() => {
    let active = true;
    authClient.listSessions().then(({ data, error }) => {
      if (active) applyResult(data, error);
    });
    return () => {
      active = false;
    };
  }, []);

  async function reload() {
    setError("");
    const { data, error } = await authClient.listSessions();
    applyResult(data, error);
  }

  async function revokeOne(token: string) {
    setBusy(true);
    await authClient.revokeSession({ token });
    await reload();
    setBusy(false);
  }

  async function revokeOthers() {
    setBusy(true);
    await authClient.revokeOtherSessions();
    await reload();
    setBusy(false);
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Active sessions</Card.Title>
        <Card.Description>
          Devices currently signed in to your account.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {sessions.map((s) => {
              const isCurrent = currentToken && s.token === currentToken;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {deviceLabel(s.userAgent)}
                      </span>
                      {isCurrent && (
                        <Chip size="sm" color="success" variant="soft">
                          This device
                        </Chip>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted">
                      {s.ipAddress || "Unknown IP"} ·{" "}
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="tertiary"
                      isDisabled={busy}
                      onPress={() => revokeOne(s.token)}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {sessions.length > 1 && (
          <div>
            <Button
              variant="danger-soft"
              isDisabled={busy}
              onPress={revokeOthers}
            >
              Sign out all other sessions
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
