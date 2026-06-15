"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ComboBox,
  Input,
  ListBox,
  Chip,
  ListBoxItem,
  useOverlayState,
} from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import type { Author } from "@/app/lib/article-types";
import { AppAvatar } from "@/app/components/ui/AppAvatar";
import { AuthorFormModal } from "@/app/(private)/admin/authors/AuthorFormModal";
import { Labeled } from "./Labeled";

/**
 * Author picker card. ComboBox over existing authors with two satellite
 * icon buttons: `+` to create, pencil to edit the currently-selected
 * record. Both open the shared `AuthorFormModal`.
 *
 * No `allowsCustomValue` — typing only filters the dropdown. Auto-create
 * by name happens only through the modal, never from a stray name.
 */
export function AuthorPickerCard({
  authors,
  authorId,
  authorName,
  authorAvatarUrl,
  setAuthorId,
  setAuthorName,
  setAuthorAvatarUrl,
}: {
  authors: Author[];
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  setAuthorId: (v: string) => void;
  setAuthorName: (v: string) => void;
  setAuthorAvatarUrl: (v: string) => void;
}) {
  const overlay = useOverlayState();
  // `editing === undefined` → create mode; defined → edit that author.
  const [editing, setEditing] = useState<Author | undefined>(undefined);
  const selectedAuthor = authors.find((a) => a.id === authorId);

  const openCreate = () => {
    setEditing(undefined);
    overlay.open();
  };
  const openEdit = () => {
    if (!selectedAuthor) return;
    setEditing(selectedAuthor);
    overlay.open();
  };
  /** Sync local picker state with the just-saved record so the new/updated
   *  author shows immediately — the modal also fires router.refresh()
   *  so the parent's `authors` prop catches up. */
  const handleSaved = (saved?: Author) => {
    if (!saved) return;
    setAuthorId(saved.id);
    setAuthorName(saved.name);
    setAuthorAvatarUrl(saved.avatarUrl ?? "");
  };

  return (
    <>
      <Card>
        <Card.Header className="flex flex-row justify-between gap-2">
          <Card.Title className="text-sm font-semibold">Author</Card.Title>
          <Chip size="sm" variant="soft" color="success" className="px-2">
            {authors.length} author{authors.length !== 1 ? "s" : ""}
          </Chip>
        </Card.Header>
        <Card.Content className="space-y-4">
          <Labeled
            label="Name"
            hint="Pick an existing author. Use + to add a new one."
          >
            <div className="flex items-stretch gap-2">
              {/* Selected author's avatar overlays the input's left
                  padding — picker doubles as the preview. */}
              <div className="relative flex-1">
                {authorId && (
                  <AppAvatar
                    src={authorAvatarUrl}
                    name={authorName || "?"}
                    size="sm"
                    className="pointer-events-none absolute left-2 top-1/2 z-10 size-6 -translate-y-1/2 rounded-lg"
                  />
                )}
                <ComboBox
                  aria-label="Author"
                  items={authors}
                  menuTrigger="focus"
                  selectedKey={authorId || null}
                  onSelectionChange={(key) => {
                    const a = authors.find((x) => x.id === String(key));
                    if (a) {
                      setAuthorId(a.id);
                      setAuthorName(a.name);
                      setAuthorAvatarUrl(a.avatarUrl ?? "");
                    } else {
                      setAuthorId("");
                      setAuthorName("");
                      setAuthorAvatarUrl("");
                    }
                  }}
                >
                  <ComboBox.InputGroup>
                    <Input
                      variant="secondary"
                      fullWidth
                      placeholder="Search authors…"
                      className={authorId ? "pl-10" : ""}
                    />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox>
                      {(author: Author) => (
                        <ListBoxItem id={author.id} textValue={author.name}>
                          <div className="flex items-center gap-2">
                            <AppAvatar
                              src={author.avatarUrl}
                              name={author.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {author.name}
                              </div>
                              {author.role && (
                                <div className="truncate text-xs text-muted">
                                  {author.role}
                                </div>
                              )}
                            </div>
                          </div>
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>
              </div>
              {authorId && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  aria-label="Edit author"
                  onPress={openEdit}
                >
                  <Pencil className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="md"
                aria-label="Create author"
                onPress={openCreate}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </Labeled>
        </Card.Content>
      </Card>

      <AuthorFormModal
        isOpen={overlay.isOpen}
        onOpenChange={overlay.setOpen}
        author={editing}
        onSaved={handleSaved}
      />
    </>
  );
}
