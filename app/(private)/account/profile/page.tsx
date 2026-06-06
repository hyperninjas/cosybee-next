"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";

export default function ProfilePage() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  if (isPending) {
    return (
      <Card className="items-center justify-center p-10">
        <Spinner />
      </Card>
    );
  }
  if (!user) return null;

  // Key by user id so the form re-initialises if the session user changes —
  // avoids a setState-in-effect to seed the inputs.
  return (
    <ProfileForm
      key={user.id}
      initialName={user.name ?? ""}
      initialImage={user.image ?? null}
      email={user.email}
    />
  );
}

function ProfileForm({
  initialName,
  initialImage,
  email,
}: {
  initialName: string;
  initialImage: string | null;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<string | null>(initialImage);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  // Persist the avatar the moment the upload finishes (or it's removed), using
  // the URL passed straight from the uploader. We deliberately do NOT wait for
  // the form submit to read `image` back out of React state: that value can be
  // stale on the same render tick (and is lost on a remount), which is what
  // made `updateUser` send `image: undefined` and silently never save. Passing
  // the argument directly fires the API call regardless of React state.
  async function handleImageChange(url: string | null) {
    setImage(url);
    setStatus(null);
    const { error } = await authClient.updateUser({ image: url });
    if (error) {
      setStatus({ kind: "error", message: error.message || "Could not save photo." });
      return;
    }
    // Bust the session cookie cache so the nav avatar / server components show
    // the new photo immediately.
    await authClient.getSession({ query: { disableCookieCache: true } });
    router.refresh();
    setStatus({ kind: "ok", message: url ? "Photo updated." : "Photo removed." });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    // The photo saves on upload (above); the form just persists the name.
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) {
      setStatus({ kind: "error", message: error.message || "Could not save changes." });
      setSaving(false);
      return;
    }
    await authClient.getSession({ query: { disableCookieCache: true } });
    router.refresh();
    setStatus({ kind: "ok", message: "Profile saved." });
    setSaving(false);
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>
          Update your name and profile photo.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <Label className="mb-2 block">Profile photo</Label>
            <div className="max-w-xs">
              <PublicImageUpload
                context="user-avatar"
                value={image}
                onChange={handleImageChange}
              />
            </div>
          </div>

          <TextField
            name="name"
            type="text"
            isRequired
            value={name}
            onChange={setName}
          >
            <Label>Full name</Label>
            <Input placeholder="Your name" autoComplete="name" />
          </TextField>

          <TextField name="email" type="email" isDisabled value={email}>
            <Label>Email</Label>
            <Input />
          </TextField>

          {status && (
            <Alert status={status.kind === "ok" ? "success" : "danger"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{status.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <div>
            <Button type="submit" isPending={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
