"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertDialog,
  Button,
  Card,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { isFreshSessionError } from "@/app/lib/api-error";
import { ReauthNotice } from "@/app/components/account/ReauthNotice";

export function DangerZoneCard({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();

  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Both actions are "sensitive" → may need a fresh sign-in.
  const [reauth, setReauth] = useState(false);

  async function changeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailStatus(null);
    setReauth(false);
    setEmailBusy(true);
    const { error } = await authClient.changeEmail({
      newEmail: newEmail.trim(),
      callbackURL: "/account/email-changed",
    });
    if (error) {
      if (isFreshSessionError(error)) setReauth(true);
      else setEmailStatus({ kind: "error", message: error.message || "Could not change email." });
    } else {
      setEmailStatus({
        kind: "ok",
        message:
          "Check your current inbox and click the link to confirm — your email updates once you do.",
      });
      setNewEmail("");
    }
    setEmailBusy(false);
  }

  async function deleteAccount() {
    setDeleteError("");
    setReauth(false);
    setDeleteBusy(true);
    const { error } = await authClient.deleteUser({ callbackURL: "/" });
    if (error) {
      if (isFreshSessionError(error)) setReauth(true);
      else setDeleteError(error.message || "Could not delete account.");
      setDeleteBusy(false);
      return;
    }
    // Account deleted (a goodbye email is sent automatically) → goodbye screen.
    router.push("/goodbye");
    router.refresh();
  }

  return (
    <Card className="border-danger/30">
      <Card.Header>
        <Card.Title>Danger zone</Card.Title>
        <Card.Description>Change your email or delete your account.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-8">
        {reauth && <ReauthNotice />}
        {/* Change email */}
        <form onSubmit={changeEmail} className="flex max-w-md flex-col gap-3">
          <TextField
            name="newEmail"
            type="email"
            isRequired
            value={newEmail}
            onChange={setNewEmail}
          >
            <Label>Change email</Label>
            <Input variant="secondary" placeholder={currentEmail} autoComplete="email" />
          </TextField>
          {emailStatus && (
            <Alert status={emailStatus.kind === "ok" ? "success" : "danger"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{emailStatus.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}
          <div>
            <Button type="submit" variant="secondary" isPending={emailBusy}>
              Update email
            </Button>
          </div>
        </form>

        {/* Delete account */}
        <div className="border-t border-border pt-6">
          <p className="mb-1 text-sm font-semibold text-foreground">Delete account</p>
          <p className="mb-3 text-sm text-muted">
            Permanently remove your account and all associated data. This cannot
            be undone.
          </p>
          {deleteError && (
            <div className="mb-3">
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{deleteError}</Alert.Title>
                </Alert.Content>
              </Alert>
            </div>
          )}
          <AlertDialog>
            <Button variant="danger">Delete account</Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.Header>
                    <AlertDialog.Heading>Delete your account?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    This permanently deletes your EnergieBee account and cannot
                    be undone.
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button
                      slot="close"
                      variant="danger"
                      isPending={deleteBusy}
                      onPress={deleteAccount}
                    >
                      Delete account
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      </Card.Content>
    </Card>
  );
}
