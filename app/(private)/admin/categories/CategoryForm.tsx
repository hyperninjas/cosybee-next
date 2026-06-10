"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Input,
  ListBox,
  ListBoxItem,
  Select,
  TextArea,
} from "@heroui/react";
import type { Category } from "@/app/lib/article-types";
import { saveCategory } from "../taxonomy/actions";
import { initialSaveState } from "../lib/form-state";
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

export default function CategoryForm({ category }: { category?: Category }) {
  const [state, formAction] = useActionState(saveCategory, initialSaveState);
  const errors = state?.fieldErrors ?? {};

  const [blog, setBlog] = useState<"hive" | "learn">(category?.blog ?? "hive");
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category?.slug));
  const [description, setDescription] = useState(category?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    category?.seoDescription ?? "",
  );
  const [iconUrl, setIconUrl] = useState(category?.iconUrl ?? "");
  const [color, setColor] = useState(category?.color ?? "");

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={formAction} className="space-y-5">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="blog" value={blog} />
      <input type="hidden" name="slug" value={effectiveSlug} />
      <input type="hidden" name="iconUrl" value={iconUrl} />

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
          <Card.Title className="text-sm font-semibold">Basics</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled label="Blog" error={errors.blog}>
            <Select
              aria-label="Blog"
              selectedKey={blog}
              onSelectionChange={(k) => setBlog(String(k) as "hive" | "learn")}
            >
              <Select.Trigger className="w-48">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="hive">Hive</ListBoxItem>
                  <ListBoxItem id="learn">Learn</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select>
          </Labeled>
          <Labeled label="Name" error={errors.name}>
            <Input
              variant="secondary"
              fullWidth
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Solar"
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
              /{blog}?category={effectiveSlug || "…"}
            </span>
          </Labeled>
          <Labeled label="Description">
            <TextArea
              variant="secondary"
              fullWidth
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Labeled>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">SEO</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled label="SEO title" hint="Defaults to the name.">
            <Input
              variant="secondary"
              fullWidth
              name="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={name || "Defaults to name"}
            />
          </Labeled>
          <Labeled label="SEO description" hint="Defaults to the description.">
            <TextArea
              variant="secondary"
              fullWidth
              name="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              placeholder={description || "Defaults to description"}
            />
          </Labeled>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Visual</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled label="Icon">
            <PublicImageUpload
              context="blog-cover"
              value={iconUrl || null}
              onChange={(url) => setIconUrl(url ?? "")}
              alt={`${name} category icon`}
            />
          </Labeled>
          <Labeled
            label="Colour"
            hint='CSS-friendly token (e.g. "#EE3D1A" or "oklch(...)"). Used in pills and accents.'
          >
            <Input
              variant="secondary"
              fullWidth
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#EE3D1A"
            />
          </Labeled>
        </Card.Content>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/admin/categories"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
        <SaveButton label={category ? "Update category" : "Create category"} />
      </div>
    </form>
  );
}
