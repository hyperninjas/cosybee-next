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
import type { Tag } from "@/app/lib/article-types";
import { saveTag } from "../taxonomy/actions";
import { initialSaveState } from "../lib/form-state";
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

export default function TagForm({
  tag,
  onSaved,
  onCancel,
}: {
  tag?: Tag;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(saveTag, initialSaveState);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) onSaved?.();
  }, [state, onSaved]);

  const [name, setName] = useState(tag?.name ?? "");
  // On rename, keep the existing slug stable so /tag/<slug> URLs survive.
  // Only auto-derive a slug when creating a brand-new tag.
  const [slug, setSlug] = useState(tag?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(tag?.slug));
  const [description, setDescription] = useState(tag?.description ?? "");

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={formAction} className="space-y-5">
      {tag && <input type="hidden" name="id" value={tag.id} />}
      {/* Empty slug = backend keeps existing slug on rename. Only send when
          the admin explicitly edits it. */}
      {slugTouched && <input type="hidden" name="slug" value={effectiveSlug} />}

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
          <Card.Title className="text-sm font-semibold">Tag</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled label="Name" error={errors.name}>
            <Input
              variant="secondary"
              fullWidth
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="solar panels"
            />
          </Labeled>
          <Labeled
            label="Slug"
            hint={
              tag
                ? "Edit only if you really want to change the public URL."
                : "Auto from the name. Edit to override."
            }
          >
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
              /tag/{effectiveSlug || "…"}
            </span>
          </Labeled>
          <Labeled
            label="Description"
            hint="Short blurb shown on the tag page."
          >
            <TextArea
              variant="secondary"
              fullWidth
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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
        <SaveButton label={tag ? "Update tag" : "Create tag"} />
      </div>
    </form>
  );
}
