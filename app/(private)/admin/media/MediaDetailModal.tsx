"use client";

import { useRef, useState } from "react";
import {
  Button,
  Input,
  ListBox,
  Modal,
  Select,
  TextArea,
  toast,
  useOverlayState,
} from "@heroui/react";
import NextImage from "next/image";
import { ArrowUpRightFromSquare } from "@gravity-ui/icons";
import {
  deleteLibraryMedia,
  replaceMediaThumbnail,
  updateMedia,
  type MediaFolder,
  type MediaItem,
} from "@/app/lib/storage";
import type { Tag } from "@/app/lib/article-types";
import {
  formatBytes,
  formatDuration,
  KIND_LABEL,
  KindIcon,
} from "./media-utils";
import { ConfirmDialog } from "./ConfirmDialog";

const UNFILED = "__unfiled__";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

/** Visual preview of the asset by kind. */
function Preview({ media }: { media: MediaItem }) {
  if (media.kind === "image" && media.url) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
        {/* Remote S3 image — unoptimized (the host may resolve to a private IP). */}
        <NextImage
          src={media.url}
          alt={media.alt ?? media.name ?? ""}
          fill
          unoptimized
          className="object-contain"
        />
      </div>
    );
  }
  if (media.kind === "video" && media.url) {
    return (
      <video
        src={media.url}
        poster={media.thumbnailUrl ?? undefined}
        controls
        className="aspect-video w-full rounded-lg border border-border bg-black"
      />
    );
  }
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background text-muted">
      <KindIcon kind={media.kind} className="size-10" />
      <span className="text-xs">{media.ext ?? media.mimeType}</span>
      {media.url && (
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-accent hover:underline"
        >
          Open file
        </a>
      )}
    </div>
  );
}

/**
 * The stateful detail form. Rendered with `key={media.id}` by the wrapper so a
 * different item remounts it — state seeds straight from props, no resetting
 * effect needed.
 */
function DetailContent({
  media,
  folders,
  allTags,
  onClose,
  onSaved,
  onDeleted,
}: {
  media: MediaItem;
  folders: MediaFolder[];
  allTags: Tag[];
  onClose: () => void;
  onSaved: (updated: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState(media.name ?? "");
  const [alt, setAlt] = useState(media.alt ?? "");
  const [title, setTitle] = useState(media.title ?? "");
  const [caption, setCaption] = useState(media.caption ?? "");
  const [credit, setCredit] = useState(media.credit ?? "");
  const [description, setDescription] = useState(media.description ?? "");
  const [folderId, setFolderId] = useState<string>(media.folderId ?? UNFILED);
  const [tagIds, setTagIds] = useState<Set<string>>(
    () => new Set(media.tags.map((t) => t.id)),
  );
  // Typed-but-not-yet-created tag names; created + linked on save.
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [replacingThumb, setReplacingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const deleteOverlay = useOverlayState();

  function toggleTag(id: string) {
    setTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addTypedTag() {
    const value = tagInput.trim();
    if (!value) return;
    setTagInput("");
    // If it already exists, just select it rather than creating a duplicate.
    const existing = allTags.find(
      (t) => t.name.toLowerCase() === value.toLowerCase(),
    );
    if (existing) {
      setTagIds((prev) => new Set(prev).add(existing.id));
      return;
    }
    setNewTags((prev) =>
      prev.some((n) => n.toLowerCase() === value.toLowerCase())
        ? prev
        : [...prev, value],
    );
  }

  async function handleReplaceThumb(file: File) {
    setReplacingThumb(true);
    try {
      const updated = await replaceMediaThumbnail(media.id, file);
      onSaved(updated);
      toast.success("Thumbnail updated");
    } catch (e) {
      toast.danger((e as Error).message || "Could not update thumbnail");
    } finally {
      setReplacingThumb(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMedia(media.id, {
        name: name.trim() || media.name || media.key,
        alt: alt.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
        credit: credit.trim() || null,
        description: description.trim() || null,
        folderId: folderId === UNFILED ? null : folderId,
        tagIds: [...tagIds],
        tagNames: newTags.length ? newTags : undefined,
      });
      onSaved(updated);
      toast.success("Saved");
      onClose();
    } catch (e) {
      toast.danger((e as Error).message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const dimensions =
    media.width && media.height ? `${media.width}×${media.height}` : null;
  const duration = formatDuration(media.durationMs);

  return (
    <>
      <Modal.Header>
        <Modal.Heading className="text-lg font-extrabold text-foreground">
          Media details
        </Modal.Heading>
      </Modal.Header>
      <Modal.Body className="max-h-[72vh] space-y-5 overflow-y-auto">
        <Preview media={media} />

        {/* Replace the poster/thumbnail (mainly for video — pick a custom image). */}
        {media.kind === "video" && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
            <span className="text-xs text-muted">
              Custom poster image for this video.
            </span>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleReplaceThumb(f);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              isPending={replacingThumb}
              onPress={() => thumbInputRef.current?.click()}
            >
              Replace thumbnail
            </Button>
          </div>
        )}

        {/* Read-only facts */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Type</dt>
            <dd className="font-medium text-foreground">
              {media.kind ? KIND_LABEL[media.kind] : media.mimeType}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Size</dt>
            <dd className="font-medium text-foreground">
              {formatBytes(media.sizeBytes)}
            </dd>
          </div>
          {dimensions && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Dimensions</dt>
              <dd className="font-medium text-foreground">{dimensions}</dd>
            </div>
          )}
          {duration && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Duration</dt>
              <dd className="font-medium text-foreground">{duration}</dd>
            </div>
          )}
          {media.pageCount != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Pages</dt>
              <dd className="font-medium text-foreground">{media.pageCount}</dd>
            </div>
          )}
          <div className="col-span-2 flex justify-between gap-2">
            <dt className="shrink-0 text-muted">URL</dt>
            <dd className="truncate">
              {media.url ? (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {media.url}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>

        {/* Editable metadata */}
        <Field label="Name">
          <Input
            variant="secondary"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        {media.kind === "image" && (
          <Field label="Alt text">
            <Input
              variant="secondary"
              fullWidth
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for screen readers"
            />
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input
              variant="secondary"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Credit">
            <Input
              variant="secondary"
              fullWidth
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Caption">
          <TextArea
            variant="secondary"
            fullWidth
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </Field>

        <Field label="Description">
          <TextArea
            variant="secondary"
            fullWidth
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {/* Folder */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-foreground">Folder</span>
          <Select
            aria-label="Folder"
            variant="secondary"
            className="w-full"
            selectedKey={folderId}
            onSelectionChange={(k) => setFolderId(String(k))}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={UNFILED} textValue="Unfiled">
                  Unfiled
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {folders.map((f) => (
                  <ListBox.Item key={f.id} id={f.id} textValue={f.name}>
                    {f.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground">Tags</span>

          {/* Add / create a tag */}
          <div className="flex items-center gap-2">
            <Input
              aria-label="Add a tag"
              variant="secondary"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTypedTag();
                }
              }}
              placeholder="Type a tag and press Enter"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="secondary"
              onPress={addTypedTag}
              isDisabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>

          {/* Pending new tags (created on save) */}
          {newTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newTags.map((n) => (
                <span
                  key={n}
                  className="flex items-center gap-1 rounded-full border border-accent bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                >
                  #{n}
                  <button
                    type="button"
                    aria-label={`Remove ${n}`}
                    onClick={() =>
                      setNewTags((prev) => prev.filter((x) => x !== n))
                    }
                    className="text-accent/70 hover:text-accent"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Existing tag vocabulary — click to toggle */}
          {allTags.length === 0 ? (
            <p className="text-xs text-muted">
              No saved tags yet — type above to create one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => {
                const on = tagIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Usages */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-foreground">
            Used in {media.usages.length}{" "}
            {media.usages.length === 1 ? "post" : "posts"}
          </span>
          {media.usages.length > 0 && (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {media.usages.map((u) => (
                <li key={`${u.postId}-${u.role}`}>
                  <a
                    href={`/admin/posts/${u.postId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Edit post in a new tab"
                    className="group flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-background"
                  >
                    <span className="min-w-0 flex-1 truncate text-foreground group-hover:text-accent">
                      {u.title}
                    </span>
                    <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                      {u.role}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">
                      {u.status}
                    </span>
                    <ArrowUpRightFromSquare className="size-3.5 shrink-0 text-muted group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {media.authorUsages.length > 0 && (
            <>
              <span className="text-xs font-semibold text-foreground ml-1">
                Used by {media.authorUsages.length}{" "}
                {media.authorUsages.length === 1 ? "author" : "authors"}
              </span>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {media.authorUsages.map((a) => (
                  <li key={a.authorId}>
                    <a
                      href={`/admin/authors?edit=${a.authorId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Edit author in a new tab"
                      className="group flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-background"
                    >
                      <span className="min-w-0 flex-1 truncate text-foreground group-hover:text-accent">
                        {a.name}
                      </span>
                      <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                        avatar
                      </span>
                      <ArrowUpRightFromSquare className="size-3.5 shrink-0 text-muted group-hover:text-accent" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {media.providerUsages.length > 0 && (
            <>
              <span className="ml-1 text-xs font-semibold text-foreground">
                Used by {media.providerUsages.length}{" "}
                {media.providerUsages.length === 1 ? "provider" : "providers"}
              </span>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {media.providerUsages.map((p) => (
                  <li key={p.providerId}>
                    <a
                      href={`/admin/tariffs?editProvider=${p.providerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Edit provider in a new tab"
                      className="group flex items-center gap-3 px-3 py-2 text-xs transition-colors hover:bg-background"
                    >
                      <span className="min-w-0 flex-1 truncate text-foreground group-hover:text-accent">
                        {p.name}
                      </span>
                      <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                        logo
                      </span>
                      <ArrowUpRightFromSquare className="size-3.5 shrink-0 text-muted group-hover:text-accent" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-danger"
          onPress={() => deleteOverlay.open()}
          isDisabled={
            media.usages.length > 0 ||
            media.authorUsages.length > 0 ||
            media.providerUsages.length > 0
          }
        >
          Delete
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="tertiary" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave} isPending={saving}>
            Save changes
          </Button>
        </div>
      </Modal.Footer>

      <ConfirmDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete “${media.name ?? media.key}”?`}
        description="This permanently removes the file from storage. This cannot be undone."
        onConfirm={async () => {
          await deleteLibraryMedia(media);
          onDeleted(media.id);
          onClose();
          toast.success("Media deleted");
        }}
      />
    </>
  );
}

export function MediaDetailModal({
  media,
  isOpen,
  onOpenChange,
  folders,
  allTags,
  onSaved,
  onDeleted,
}: {
  media: MediaItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  folders: MediaFolder[];
  allTags: Tag[];
  onSaved: (updated: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {media && (
              <DetailContent
                key={media.id}
                media={media}
                folders={folders}
                allTags={allTags}
                onClose={() => onOpenChange(false)}
                onSaved={onSaved}
                onDeleted={onDeleted}
              />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
