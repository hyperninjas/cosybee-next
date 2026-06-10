"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Alert,
  Button,
  Card,
  Input,
  TextArea,
} from "@heroui/react";
import type { Author } from "@/app/lib/article-types";
import { saveAuthor } from "../taxonomy/actions";
import { initialSaveState, type EntitySaveState } from "../lib/form-state";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { slugify } from "@/app/lib/slug";

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      isDisabled={pending}
      isPending={pending}
    >
      {label}
    </Button>
  );
}

export default function AuthorForm({
  author,
  onSaved,
  onCancel,
}: {
  author?: Author;
  /** Called when the server action returns `{ ok: true }`. The saved
   *  Author is forwarded so callers (e.g. the post-editor's create-author
   *  modal) can auto-select the new record without a refetch. */
  onSaved?: (saved?: Author) => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState<EntitySaveState<Author>, FormData>(
    saveAuthor,
    initialSaveState,
  );
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) onSaved?.(state.entity);
  }, [state, onSaved]);

  const [name, setName] = useState(author?.name ?? "");
  const [slug, setSlug] = useState(author?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(author?.slug));
  const [avatarUrl, setAvatarUrl] = useState(author?.avatarUrl ?? "");
  const [avatarAlt, setAvatarAlt] = useState(author?.avatarAlt ?? "");
  const [bio, setBio] = useState(author?.bio ?? "");
  const [role, setRole] = useState(author?.role ?? "");
  const [email, setEmail] = useState(author?.email ?? "");
  const [website, setWebsite] = useState(author?.website ?? "");
  const [twitter, setTwitter] = useState(author?.twitter ?? "");
  const [linkedin, setLinkedin] = useState(author?.linkedin ?? "");
  const [github, setGithub] = useState(author?.github ?? "");

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={formAction} className="space-y-5">
      {author && <input type="hidden" name="id" value={author.id} />}
      <input type="hidden" name="slug" value={effectiveSlug} />

      {state?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Identity</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled label="Name" error={errors.name}>
            <Input
              variant="secondary"
              fullWidth
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </Labeled>
          <Labeled label="Slug" hint="Auto from the name. Edit to override.">
            <Input
              variant="secondary"
              fullWidth
              className="font-mono"
              value={effectiveSlug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugTouched(true);
              }}
            />
            <span className="mt-1 block text-xs text-muted">
              /author/{effectiveSlug || "…"}
            </span>
          </Labeled>
          <Labeled label="Role" hint="Job title shown beneath the avatar.">
            <Input
              variant="secondary"
              fullWidth
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Energy systems lead"
            />
          </Labeled>
          <Labeled label="Bio">
            <TextArea
              variant="secondary"
              fullWidth
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </Labeled>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Avatar</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <PublicImageUpload
            context="author-avatar"
            value={avatarUrl || null}
            onChange={(url) => setAvatarUrl(url ?? "")}
            alt={avatarAlt || name}
          />
          <input type="hidden" name="avatarUrl" value={avatarUrl} />
          <Labeled label="Alt text" hint="Defaults to the name.">
            <Input
              variant="secondary"
              fullWidth
              name="avatarAlt"
              value={avatarAlt}
              onChange={(e) => setAvatarAlt(e.target.value)}
              placeholder={name || "Author avatar"}
            />
          </Labeled>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Contact</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled label="Email">
            <Input
              variant="secondary"
              fullWidth
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </Labeled>
          <Labeled label="Website">
            <Input
              variant="secondary"
              fullWidth
              type="url"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://janedoe.com"
            />
          </Labeled>
          <Labeled label="Twitter" hint="Handle without the @.">
            <Input
              variant="secondary"
              fullWidth
              name="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="janedoe"
            />
          </Labeled>
          <Labeled label="LinkedIn" hint="Profile URL or handle.">
            <Input
              variant="secondary"
              fullWidth
              name="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/janedoe"
            />
          </Labeled>
          <Labeled label="GitHub" hint="Handle without the @.">
            <Input
              variant="secondary"
              fullWidth
              name="github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="janedoe"
            />
          </Labeled>
        </Card.Content>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <SaveButton label={author ? "Update author" : "Create author"} />
      </div>
    </form>
  );
}
