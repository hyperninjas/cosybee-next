"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  useOverlayState,
} from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import type { Category } from "@/app/lib/article-types";
import { CategoryFormModal } from "@/app/(private)/admin/categories/CategoryFormModal";
import { Labeled } from "./Labeled";

/**
 * Category picker card. Mirrors AuthorPickerCard's shape — ComboBox over
 * the categories scoped to the current `blog`, with `+` and pencil icon
 * buttons that open the shared CategoryFormModal.
 *
 * The selected category's colour swatch overlays the input as a visual
 * cue, mirroring the avatar treatment on the author picker.
 */
export function CategoryPickerCard({
  blog,
  blogCategories,
  categoryId,
  setCategoryId,
  setCategoryName,
}: {
  blog: "hive" | "learn" | string;
  blogCategories: Category[];
  categoryId: string;
  setCategoryId: (v: string) => void;
  setCategoryName: (v: string) => void;
}) {
  const overlay = useOverlayState();
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const selectedCategory = blogCategories.find((c) => c.id === categoryId);

  const openCreate = () => {
    setEditing(undefined);
    overlay.open();
  };
  const openEdit = (selected: Category) => {
    setEditing(selected);
    overlay.open();
  };
  const handleSaved = (saved?: Category) => {
    if (!saved) return;
    setCategoryId(saved.id);
    setCategoryName(saved.name);
  };

  return (
    <>
      <Card>
        <Card.Header className="flex flex-row justify-between gap-2">
          <Card.Title className="text-sm font-semibold">Category</Card.Title>
          <p className="text-xs text-muted">
            {blogCategories.length} in {blog}
          </p>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              {categoryId && selectedCategory?.color && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-3 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
              )}
              <ComboBox
                aria-label="Category"
                items={blogCategories}
                menuTrigger="focus"
                selectedKey={categoryId || null}
                onSelectionChange={(key) => {
                  const c = blogCategories.find((x) => x.id === String(key));
                  if (c) {
                    setCategoryId(c.id);
                    setCategoryName(c.name);
                  } else {
                    setCategoryId("");
                    setCategoryName("");
                  }
                }}
              >
                <ComboBox.InputGroup>
                  <Input
                    variant="secondary"
                    fullWidth
                    placeholder={
                      blogCategories.length > 0
                        ? "Search categories…"
                        : "No categories yet"
                    }
                    className={
                      categoryId && selectedCategory?.color ? "pl-9" : ""
                    }
                  />
                  <ComboBox.Trigger />
                </ComboBox.InputGroup>
                <ComboBox.Popover>
                  <ListBox>
                    {(category: Category) => (
                      <ListBoxItem id={category.id} textValue={category.name}>
                        <div className="flex items-center gap-2">
                          {category.color && (
                            <span
                              aria-hidden
                              className="inline-block size-3 shrink-0 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <span className="truncate">{category.name}</span>
                        </div>
                      </ListBoxItem>
                    )}
                  </ListBox>
                </ComboBox.Popover>
              </ComboBox>
            </div>
            {selectedCategory && (
              <Button
                type="button"
                variant="outline"
                size="md"
                aria-label="Edit category"
                onPress={() => openEdit(selectedCategory)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="md"
              aria-label="Create category"
              onPress={openCreate}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </Card.Content>
      </Card>

      <CategoryFormModal
        isOpen={overlay.isOpen}
        onOpenChange={overlay.setOpen}
        category={editing}
        defaultBlog={blog === "hive" || blog === "learn" ? blog : "hive"}
        onSaved={handleSaved}
      />
    </>
  );
}
