"use client";

import { useState } from "react";
import { Button, Dropdown, Input, Label, toast, useOverlayState } from "@heroui/react";
import {
  createFolder,
  deleteFolder,
  updateFolder,
  type MediaFolder,
} from "@/app/lib/storage";
import { FolderIcon } from "./media-utils";
import { ConfirmDialog } from "./ConfirmDialog";

/** Special selection keys for the non-folder scopes. */
export type FolderSelection = "all" | "unfiled" | (string & {});

interface TreeNode extends MediaFolder {
  children: TreeNode[];
  depth: number;
}

/** Build a depth-annotated tree from the flat folder list. */
function buildTree(folders: MediaFolder[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const f of folders) byId.set(f.id, { ...f, children: [], depth: 0 });
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes: TreeNode[], depth: number) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of nodes) {
      n.depth = depth;
      sortRec(n.children, depth + 1);
    }
  };
  sortRec(roots, 0);
  return roots;
}

function flatten(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** A selectable scope/folder row in the sidebar. */
function ScopeButton({
  active,
  onPress,
  icon,
  label,
  count,
}: {
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        active ? "bg-accent/10 font-semibold text-accent" : "text-foreground hover:bg-background"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && <span className="text-xs text-muted">{count}</span>}
    </button>
  );
}

export function FolderSidebar({
  folders,
  selected,
  onSelect,
  onChanged,
}: {
  folders: MediaFolder[];
  selected: FolderSelection;
  onSelect: (key: FolderSelection) => void;
  /** Re-fetch folders after a mutation. */
  onChanged: () => void;
}) {
  // The React Compiler (compilationMode: "all") memoizes this for us, so no
  // manual useMemo — wrapping these helpers in useMemo makes the compiler
  // instrument them and the dev runtime then mis-reports them as hooks.
  const ordered = flatten(buildTree(folders));

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  // Inline rename state.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Delete confirm.
  const deleteOverlay = useOverlayState();
  const [deleting, setDeleting] = useState<MediaFolder | null>(null);

  // New folders nest under the currently-open folder (when one is selected).
  const parentForNew = typeof selected === "string" && selected !== "all" && selected !== "unfiled"
    ? selected
    : null;

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const folder = await createFolder({ name, parentId: parentForNew });
      setNewName("");
      setCreating(false);
      onChanged();
      onSelect(folder.id);
      toast.success(`Folder “${folder.name}” created`);
    } catch (e) {
      toast.danger((e as Error).message || "Could not create folder");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(folder: MediaFolder) {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === folder.name) return;
    try {
      await updateFolder(folder.id, { name });
      onChanged();
    } catch (e) {
      toast.danger((e as Error).message || "Could not rename folder");
    }
  }

  return (
    <aside className="flex w-full flex-col gap-1 sm:w-60 sm:shrink-0">
      <div className="mb-1 flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Folders</h2>
        <Button size="sm" variant="ghost" onPress={() => setCreating((v) => !v)}>
          + New
        </Button>
      </div>

      <ScopeButton active={selected === "all"} onPress={() => onSelect("all")} label="All media" />
      <ScopeButton
        active={selected === "unfiled"}
        onPress={() => onSelect("unfiled")}
        label="Unfiled"
      />

      <div className="my-1 h-px bg-border" />

      {ordered.length === 0 && !creating && (
        <p className="px-2.5 py-2 text-xs text-muted">No folders yet.</p>
      )}

      <ul className="flex flex-col gap-0.5">
        {ordered.map((node) => {
          const active = selected === node.id;
          const isEditing = editingId === node.id;
          return (
            <li key={node.id} className="group flex items-center gap-1">
              <div
                className="min-w-0 flex-1"
                style={{ paddingLeft: `${node.depth * 12}px` }}
              >
                {isEditing ? (
                  <Input
                    autoFocus
                    aria-label="Folder name"
                    variant="secondary"
                    defaultValue={node.name}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRename(node)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(node);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-8 text-sm"
                  />
                ) : (
                  <ScopeButton
                    active={active}
                    onPress={() => onSelect(node.id)}
                    icon={<FolderIcon className="size-4 shrink-0 text-muted" />}
                    label={node.name}
                    count={node.mediaCount}
                  />
                )}
              </div>
              {!isEditing && (
                <Dropdown>
                  <Dropdown.Trigger
                    aria-label={`Actions for ${node.name}`}
                    className="rounded-md p-1 text-muted opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                  >
                    <span aria-hidden className="text-lg leading-none">⋯</span>
                  </Dropdown.Trigger>
                  <Dropdown.Popover className="min-w-36">
                    <Dropdown.Menu
                      onAction={(key) => {
                        if (key === "rename") {
                          setEditingName(node.name);
                          setEditingId(node.id);
                        } else if (key === "delete") {
                          setDeleting(node);
                          deleteOverlay.open();
                        }
                      }}
                    >
                      <Dropdown.Item id="rename" textValue="Rename">
                        <Label>Rename</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                        <Label>Delete</Label>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              )}
            </li>
          );
        })}
      </ul>

      {creating && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <Input
            autoFocus
            aria-label="New folder name"
            variant="secondary"
            placeholder={parentForNew ? "Subfolder name…" : "Folder name…"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="primary" onPress={handleCreate} isPending={busy}>
            Add
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete folder “${deleting?.name ?? ""}”?`}
        description="The folder is removed. Its media become unfiled and any subfolders move to the top level — no files are deleted."
        onConfirm={async () => {
          if (!deleting) return;
          await deleteFolder(deleting.id);
          if (selected === deleting.id) onSelect("all");
          onChanged();
          toast.success("Folder deleted");
        }}
      />
    </aside>
  );
}
