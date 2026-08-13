"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { createContext, useContext, useRef, useState } from "react";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  FormattingToolbar,
  FormattingToolbarController,
  TextAlignButton,
  getFormattingToolbarItems,
  LinkToolbarController,
  EditLinkButton,
  OpenLinkButton,
  DeleteLinkButton,
  useComponentsContext,
  useBlockNoteEditor,
  useEditorState,
  type DefaultReactSuggestionItem,
  type LinkToolbarProps,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { flip, offset, shift, size } from "@floating-ui/react";
import {
  blockHasType,
  combineByGroup,
  editorHasBlockWithType,
  filterSuggestionItems,
  type PartialBlock,
} from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import {
  multiColumnDropCursor,
  getMultiColumnSlashMenuItems,
  locales as multiColumnLocales,
} from "@blocknote/xl-multi-column";
import { validateLibraryFile, type MediaItem } from "@/app/lib/storage";
import { uploadLibraryMedia } from "@/app/lib/media-upload";
import { altFromFileName } from "@/app/lib/image-alt";
import {
  blockNoteSchema as schema,
  collectHeadingAnchors,
  LINK_REL_TOKENS,
  type LinkRelToken,
} from "@/app/lib/blocknoteSchema";
import { searchLinkTargets, type LinkTarget } from "@/app/lib/link-targets";
import { MediaPickerModal } from "@/app/(private)/admin/media/MediaPickerModal";

type SchemaPartialBlock = typeof schema.PartialBlock;

type Props = {
  /** Initial document (parsed from Post.contentJson). */
  initialContent?: PartialBlock[];
  /** Called with the full document on every edit. */
  onChange: (blocks: PartialBlock[]) => void;
  /** Pages + published articles offered by the internal link picker. */
  linkTargets?: LinkTarget[];
  /** Path of the post being edited, so it can't link to itself. */
  currentPath?: string;
};

/**
 * Floating-UI setup for the "/" menu, replacing BlockNote's default.
 *
 * THE BUG: BlockNote pairs `autoPlacement` with `size()`, and `size()` writes
 * a `max-height` onto the menu element. On the NEXT positioning pass the menu
 * is already shrunk to that height, so the placement middleware measures a
 * short element, concludes it fits below the caret, and leaves it there. The
 * result is the behaviour you can watch: a *little* space below gets a
 * squeezed, half-visible list, and only when there is almost NO space — so
 * small that even the shrunken menu overflows — does it finally flip above.
 * The menu shrinks to fit, which removes the very overflow that would have
 * triggered the flip.
 *
 * THE FIX is the floor below. The menu may never be clamped below
 * `MIN_MENU_HEIGHT`, so in a cramped gap it keeps overflowing, the overflow is
 * still there on the next pass, and `flip` moves it above the caret where the
 * room actually is. Where there IS space, `availableHeight` wins and the menu
 * grows to use it, scrolling internally past that.
 *
 * `flip` rather than `autoPlacement` for predictability: below the caret is
 * the preferred position and it only ever falls back to above, instead of
 * re-deciding from scratch on every keystroke.
 */
const MIN_MENU_HEIGHT = 220;

const SLASH_MENU_FLOATING_OPTIONS = {
  useFloatingOptions: {
    placement: "bottom-start" as const,
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ["top-start"], padding: 10 }),
      shift({ padding: 10 }),
      size({
        padding: 10,
        apply({ elements, availableHeight }) {
          elements.floating.style.maxHeight = `${Math.max(
            MIN_MENU_HEIGHT,
            availableHeight,
          )}px`;
        },
      }),
    ],
  },
};

/** Small image/library icon for the slash menu entry. */
function MediaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5L9 20" />
    </svg>
  );
}

/**
 * Build the BlockNote block to insert for a picked media item, by kind.
 *
 * `"use no memo"` opts this helper out of the React Compiler. Under
 * `compilationMode: "all"` the compiler injects a `useMemoCache` hook into every
 * top-level function; this one is called from an event handler (not during
 * render), so the injected hook would throw "Invalid hook call".
 */
function blockForMedia(media: MediaItem): SchemaPartialBlock {
  "use no memo";
  const url = media.url ?? "";
  // Video/file blocks still have no alt field of their own, so for those the
  // caption remains the one place any descriptive text can live — keep pulling
  // the richest text the asset has.
  const caption = media.caption || media.alt || media.title || "";
  if (media.kind === "video") {
    return {
      type: "video",
      props: { url, caption, name: media.name ?? "" },
    } as SchemaPartialBlock;
  }
  if (media.kind === "image") {
    // Images DO have a real alt prop now, so the library's own fields map
    // across one-to-one instead of being collapsed into the caption: the
    // asset's alt (what it depicts) becomes alt, its caption (what to print
    // under it) becomes the caption. An asset that was described once in the
    // gallery is then correctly described everywhere it is used.
    return {
      type: "image",
      props: {
        url,
        alt: media.alt || media.title || altFromFileName(media.name),
        // Optional now — no longer padded out with alt/title, which produced
        // a visible caption the author never asked for.
        caption: media.caption ?? "",
        name: media.name ?? "",
      },
    } as SchemaPartialBlock;
  }
  // pdf / document → a downloadable file block.
  return {
    type: "file",
    props: { url, caption, name: media.name ?? media.key },
  } as SchemaPartialBlock;
}

/**
 * Formatting toolbar with an extra justify button (the default omits it even
 * though the schema + CSS support it), inserted right after right-align, and
 * a "Link to section" menu right after the link button.
 *
 * Used via FormattingToolbarController, with `formattingToolbar={false}` on
 * BlockNoteView so this REPLACES the built-in toolbar rather than stacking a
 * second one over it (two toolbars fight over focus/position and break clicks).
 *
 * `"use no memo"` is a defensive opt-out from the React Compiler
 * (`compilationMode: "all"`) for this app-level render component — same reason
 * as `blockForMedia` elsewhere in this file.
 */
function FormattingToolbarWithJustify() {
  "use no memo";
  const items = [...getFormattingToolbarItems()];
  const justify = (
    <TextAlignButton key="textAlignJustifyButton" textAlignment="justify" />
  );
  const rightIdx = items.findIndex((item) => item.key === "textAlignRightButton");
  if (rightIdx >= 0) items.splice(rightIdx + 1, 0, justify);
  else items.push(justify);
  // Both internal-link helpers sit immediately after the Link button, in the
  // order an author reaches for them: another page first, a section of THIS
  // page second.
  const pageLink = <LinkToPageButton key="linkToPageButton" />;
  const sectionLink = <LinkToSectionButton key="linkToSectionButton" />;
  const linkIdx = items.findIndex((item) => item.key === "createLinkButton");
  if (linkIdx >= 0) items.splice(linkIdx + 1, 0, pageLink, sectionLink);
  else items.push(pageLink, sectionLink);
  // Alt text sits immediately after Caption: the two are the pair an author
  // fills in for every image, and putting them together makes the distinction
  // (visible caption vs screen-reader description) obvious at the point of use.
  const altText = <AltTextButton key="imageAltTextButton" />;
  const captionIdx = items.findIndex(
    (item) => item.key === "fileCaptionButton",
  );
  if (captionIdx >= 0) items.splice(captionIdx + 1, 0, altText);
  else items.unshift(altText);
  return <FormattingToolbar>{items}</FormattingToolbar>;
}

/** Icon for the "Alt text" button — the accessibility/description mark. */
function AltTextIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 15.5 9.5 9l2.5 6.5" />
      <path d="M8 13.5h3" />
      <path d="M17 9v6.5" />
      <path d="M14.5 15.5h5" />
    </svg>
  );
}

/**
 * "Alt text" control for image blocks — the field BlockNote doesn't ship.
 *
 * Stock BlockNote publishes the upload FILE NAME as an image's alt attribute
 * and gives authors no way to change it (see blocknoteSchema.ts). This writes
 * the `alt` prop that the schema added, and appears only when a single image
 * block is selected.
 *
 * Deliberately modelled on BlockNote's own FileCaptionButton — same popover,
 * same form primitives, same Enter-to-close — so it looks and behaves like a
 * native part of the toolbar rather than a bolt-on.
 *
 * `"use no memo"` — React-Compiler exempt like every component in this file.
 */
function AltTextButton() {
  "use no memo";
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();

  // Only for a single selected block that actually carries `url` + `alt` —
  // i.e. our image block, and never a multi-block selection.
  const block = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      const selected = editor.getSelection()?.blocks ?? [
        editor.getTextCursorPosition().block,
      ];
      if (selected.length !== 1) return undefined;
      const candidate = selected[0];
      return blockHasType(candidate, editor, candidate.type, {
        url: "string",
        alt: "string",
      })
        ? candidate
        : undefined;
    },
  });

  const [open, setOpen] = useState(false);

  if (block === undefined) return null;

  return (
    <Components.Generic.Popover.Root open={open} onOpenChange={setOpen}>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Alt text"
          mainTooltip="Describe this image for screen readers and search engines"
          icon={<AltTextIcon />}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        />
      </Components.Generic.Popover.Trigger>
      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <Components.Generic.Form.Root>
          <Components.Generic.Form.TextInput
            name="image-alt"
            icon={<AltTextIcon />}
            value={(block.props as { alt?: string }).alt ?? ""}
            autoFocus
            placeholder="Describe the image (leave blank if decorative)"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                setOpen(false);
              }
            }}
            onChange={(event) => {
              if (
                editorHasBlockWithType(editor, block.type, { alt: "string" })
              ) {
                editor.updateBlock(block.id, {
                  props: { alt: event.currentTarget.value },
                });
              }
            }}
          />
        </Components.Generic.Form.Root>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
}

/**
 * The link picker's data, shared by context rather than props.
 *
 * `FormattingToolbarController` takes a COMPONENT, not an element, so there is
 * nowhere to pass props through it — and an inline wrapper would be a new
 * component type on every render, remounting the toolbar and dropping its
 * popover state mid-interaction. Context crosses the portal BlockNote renders
 * the toolbar into and keeps the component identity stable.
 */
const LinkTargetsContext = createContext<{
  targets: LinkTarget[];
  currentPath?: string;
}>({ targets: [] });

/** Row icon: a static site page. */
function PageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="bn-link-page-icon"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 6.5h.01" />
    </svg>
  );
}

/** Row icon: a blog article. */
function PostIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="bn-link-page-icon"
      aria-hidden
    >
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8.5 9h7" />
      <path d="M8.5 12.5h7" />
      <path d="M8.5 16h4" />
    </svg>
  );
}

/** Magnifier shown inside the search field. */
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="bn-link-page-search-icon"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** Icon for "Link to a page" — a link glyph over a page. */
function InternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M14 3h5a2 2 0 0 1 2 2v5" />
      <path d="M21 14v5a2 2 0 0 1-2 2h-5" />
      <path d="M10 21H5a2 2 0 0 1-2-2v-5" />
      <path d="M3 10V5a2 2 0 0 1 2-2h5" />
      <path d="M9.5 12.5h5" />
      <path d="M12.5 9.5 15 12l-2.5 2.5" />
    </svg>
  );
}

/**
 * "Link to page" — links the selected text to another page or published
 * article on this site, without anyone having to know or paste a URL.
 *
 * Works the way the Link button does, which is the point: SELECT the words you
 * want to link, and the selection is used as the search query. Writing "see
 * our guide to heat pumps" and selecting "heat pumps" surfaces the heat-pump
 * article immediately, so the common case is select → click → Enter.
 *
 * `editor.createLink(path)` with no text argument replaces the selection's
 * href and leaves the words alone, so the sentence reads as written. Paths are
 * site-relative, which is what the publish pipeline (decorateArticleLinks)
 * uses to tell internal links from external ones — internal links keep their
 * ranking signal and open in the same tab.
 *
 * Only PUBLISHED articles are offered: a link to a draft is a link to a 404
 * until someone remembers to publish it.
 *
 * `"use no memo"` — React-Compiler exempt like every component in this file.
 */
function LinkToPageButton() {
  "use no memo";
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const { targets, currentPath } = useContext(LinkTargetsContext);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Which row Enter will take. Reset to the top whenever the query changes,
  // because the list underneath it has changed.
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  if (targets.length === 0) return null;

  const results = searchLinkTargets(targets, query, {
    excludePath: currentPath,
  });
  const active = Math.min(activeIndex, Math.max(0, results.length - 1));

  const apply = (path: string) => {
    editor.createLink(path);
    setOpen(false);
    // Same trick as BlockNote's own colour menu: refocus once the focus trap
    // has released, or the caret is left nowhere.
    setTimeout(() => editor.focus());
  };

  /** Move the highlight and keep it inside the scroll area. */
  const move = (delta: number) => {
    if (results.length === 0) return;
    // Wraps at both ends, so Up from the first row jumps to the last.
    const next = (active + delta + results.length) % results.length;
    setActiveIndex(next);
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  /**
   * Open the picker with the selected words already in the search box.
   *
   * Read here, in the trigger's own click handler, and NOT in the popover's
   * `onOpenChange`: the button toggles `open` itself, so `onOpenChange` only
   * fires for dismissals and the seeding placed there never ran. This is also
   * the last moment the editor selection is reliably readable — once the
   * popover mounts, its focus trap takes the caret away.
   */
  const openWithSelection = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setQuery(editor.getSelectedText().trim());
    setActiveIndex(0);
    setOpen(true);
  };

  return (
    <Components.Generic.Popover.Root
      open={open}
      // Dismissals only (outside click, Escape) — opening goes through
      // `openWithSelection` so the selection is captured first.
      onOpenChange={setOpen}
    >
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Link to page"
          mainTooltip="Link this text to a page or article on this site"
          icon={<InternalLinkIcon />}
          onClick={openWithSelection}
        />
      </Components.Generic.Popover.Trigger>
      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div className="bn-link-page-picker">
          <div className="bn-link-page-field">
            <SearchIcon />
            <input
              className="bn-link-page-input"
              value={query}
              autoFocus
              // Select the seeded text on open, so the selection is a starting
              // point rather than something to delete: typing replaces it,
              // Enter accepts the match it already found.
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Search pages and articles…"
              role="combobox"
              aria-expanded
              aria-controls="bn-link-page-list"
              aria-activedescendant={
                results[active] ? `bn-link-page-opt-${active}` : undefined
              }
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  move(1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  move(-1);
                } else if (e.key === "Enter") {
                  // ALWAYS swallow Enter, hit or no hit. This input lives
                  // inside the post <form>, where a bare Enter submits — so a
                  // query that matched nothing would have SAVED THE POST.
                  e.preventDefault();
                  if (results[active]) apply(results[active].path);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
            />
          </div>

          <div
            className="bn-link-page-results"
            id="bn-link-page-list"
            role="listbox"
            ref={listRef}
          >
            {results.length === 0 ? (
              <p className="bn-link-page-empty">
                Nothing matches “{query}”. Use the link button to paste a URL.
              </p>
            ) : (
              results.map((target, index) => (
                <button
                  key={target.path}
                  type="button"
                  id={`bn-link-page-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  className="bn-link-page-item"
                  data-active={index === active ? "" : undefined}
                  // Highlight follows the mouse too, so clicking never selects
                  // a different row than the one under the cursor.
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => apply(target.path)}
                >
                  {target.kind === "post" ? <PostIcon /> : <PageIcon />}
                  <span className="bn-link-page-text">
                    <span className="bn-link-page-title">{target.title}</span>
                    <span className="bn-link-page-path">{target.path}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
}

/** Small list icon for the table-of-contents slash menu entry. */
function TocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M8 6h13" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M3 6h.01" />
      <path d="M5 12h.01" />
      <path d="M5 18h.01" />
    </svg>
  );
}

/** Question-mark-in-a-panel icon for the FAQ slash menu entry. */
function FaqIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9.6 9.5a2.4 2.4 0 1 1 3.2 2.3c-.5.2-.8.7-.8 1.2v.4" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

/** Code icon for the custom HTML slash menu entry. */
function CodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/** Anchor icon for the "Link to section" toolbar button. */
function AnchorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M12 22V8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
      <circle cx="12" cy="5" r="3" />
    </svg>
  );
}

/**
 * Formatting-toolbar menu that links the selected text to one of the
 * article's h2/h3 sections — no need to hand-type `#slug` anchors (the slugs
 * are predicted with the exact algorithm `buildToc` uses on publish). Hidden
 * when the article has no headings yet.
 *
 * `"use no memo"` — React-Compiler exempt like every component in this file.
 */
function LinkToSectionButton() {
  "use no memo";
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  // Recomputed per toolbar render — the toolbar only mounts on selection,
  // so this stays cheap and always current.
  const anchors = collectHeadingAnchors(
    editor.document as unknown as Parameters<typeof collectHeadingAnchors>[0],
  );

  if (anchors.length === 0) return null;

  return (
    <Components.Generic.Menu.Root>
      <Components.Generic.Menu.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Link to section"
          mainTooltip="Link selection to a section of this article"
          icon={<AnchorIcon />}
        />
      </Components.Generic.Menu.Trigger>
      <Components.Generic.Menu.Dropdown className="bn-menu-dropdown">
        {anchors.map((anchor) => (
          <Components.Generic.Menu.Item
            key={anchor.slug}
            className="bn-menu-item"
            onClick={() => {
              editor.createLink(`#${anchor.slug}`);
              // Same trick as BlockNote's own color menu: refocus after the
              // Mantine focus trap releases.
              setTimeout(() => editor.focus());
            }}
          >
            <span
              style={anchor.level === 3 ? { paddingLeft: 16 } : undefined}
            >
              {anchor.text}
            </span>
          </Components.Generic.Menu.Item>
        ))}
      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  );
}

type PmRange = { from: number; to: number };

/**
 * Read the linkRel style tokens present anywhere in a document range.
 *
 * `"use no memo"` — called from event handlers/state initializers, not
 * render; see `blockForMedia` for why the compiler must skip it.
 */
function getRelTokens(
  editor: { _tiptapEditor: unknown },
  range: PmRange,
): Set<LinkRelToken> {
  "use no memo";
  const tokens = new Set<LinkRelToken>();
  // The linkRel style is a tiptap mark carrying its value as `stringValue`.
  // BlockNote has no public API to READ styles over an arbitrary range (only
  // the current selection), so inspect the ProseMirror doc directly.
  const { state } = editor._tiptapEditor as {
    state: {
      schema: { marks: Record<string, unknown> };
      doc: {
        nodesBetween: (
          from: number,
          to: number,
          cb: (node: {
            marks: { type: unknown; attrs: { stringValue?: string } }[];
          }) => void,
        ) => void;
      };
    };
  };
  const markType = state.schema.marks["linkRel"];
  if (!markType) return tokens;
  state.doc.nodesBetween(range.from, range.to, (node) => {
    for (const mark of node.marks) {
      if (mark.type !== markType) continue;
      for (const t of (mark.attrs.stringValue ?? "").split(/\s+/)) {
        if ((LINK_REL_TOKENS as readonly string[]).includes(t)) {
          tokens.add(t as LinkRelToken);
        }
      }
    }
  });
  return tokens;
}

/** Replace the linkRel style across a range (empty list removes it). */
function setRelTokens(
  editor: { _tiptapEditor: unknown },
  range: PmRange,
  tokens: LinkRelToken[],
): void {
  "use no memo";
  const tiptap = editor._tiptapEditor as {
    state: {
      schema: {
        marks: Record<
          string,
          { create: (attrs: { stringValue: string }) => unknown } | undefined
        >;
      };
      tr: {
        removeMark: (from: number, to: number, type: unknown) => unknown;
      };
    };
    view: { dispatch: (tr: unknown) => void };
  };
  const markType = tiptap.state.schema.marks["linkRel"];
  if (!markType) return;
  let tr = tiptap.state.tr.removeMark(range.from, range.to, markType) as {
    addMark: (from: number, to: number, mark: unknown) => unknown;
  };
  if (tokens.length > 0) {
    tr = tr.addMark(
      range.from,
      range.to,
      markType.create({ stringValue: tokens.join(" ") }),
    ) as typeof tr;
  }
  tiptap.view.dispatch(tr);
}

/**
 * Link toolbar (hover/click popup on a link) extended with per-link SEO rel
 * toggles. The tokens are stored as the `linkRel` text style on the link's
 * text (see blocknoteSchema.ts); the server export hoists them onto the
 * published `<a rel>`. Default buttons (edit/open/delete) are kept.
 *
 * Used via LinkToolbarController with `linkToolbar={false}` on BlockNoteView
 * so it REPLACES the built-in toolbar (same pattern as the formatting
 * toolbar above).
 *
 * `"use no memo"` — React-Compiler exempt like every component in this file.
 */
function LinkToolbarWithRel(props: LinkToolbarProps) {
  "use no memo";
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const [tokens, setTokens] = useState<Set<LinkRelToken>>(() =>
    getRelTokens(editor, props.range),
  );

  function toggle(token: LinkRelToken) {
    const next = new Set(tokens);
    if (next.has(token)) next.delete(token);
    else next.add(token);
    setRelTokens(
      editor,
      props.range,
      LINK_REL_TOKENS.filter((t) => next.has(t)),
    );
    setTokens(next);
  }

  return (
    <Components.LinkToolbar.Root className="bn-toolbar bn-link-toolbar">
      <EditLinkButton
        url={props.url}
        text={props.text}
        range={props.range}
        setToolbarOpen={props.setToolbarOpen}
        setToolbarPositionFrozen={props.setToolbarPositionFrozen}
      />
      <OpenLinkButton url={props.url} />
      <DeleteLinkButton
        range={props.range}
        setToolbarOpen={props.setToolbarOpen}
      />
      {LINK_REL_TOKENS.map((token) => (
        <Components.LinkToolbar.Button
          key={token}
          className="bn-button"
          label={token}
          mainTooltip={`Toggle rel="${token}" on this link`}
          isSelected={tokens.has(token)}
          onClick={() => toggle(token)}
        >
          {token}
        </Components.LinkToolbar.Button>
      ))}
    </Components.LinkToolbar.Root>
  );
}

/**
 * The BlockNote (Mantine) WYSIWYG editor. Loaded client-only via next/dynamic
 * (BlockNote relies on browser APIs and can't SSR). Images dropped/added inside
 * the article upload directly to S3 via the storage module's presigned flow.
 *
 * A "/Media library" slash command opens a picker over the gallery and inserts
 * the chosen file (image/video/document) as a block — so authors can REUSE
 * library media instead of always uploading new copies.
 *
 * Multi-column support comes from @blocknote/xl-multi-column.
 */
export default function Editor({
  initialContent,
  onChange,
  linkTargets = [],
  currentPath,
}: Props) {
  const editor = useCreateBlockNote({
    schema,
    dropCursor: multiColumnDropCursor,
    links: {
      /**
       * Clicking a link in the editor should place the cursor, not navigate.
       *
       * BlockNote's link extension installs a ProseMirror click handler that
       * calls `window.open(href)` — and it is gated on `view.editable`, so the
       * behaviour applies ONLY while editing: the one mode where following a
       * link is never what you meant. Clicking a link to put the caret in it
       * (to fix a typo, or to reach the link toolbar) fired off a new tab
       * instead.
       *
       * Returning `true` marks the click handled, which suppresses the
       * navigation and leaves ProseMirror's normal caret placement alone. The
       * link toolbar still offers an explicit "Open" button for the times you
       * genuinely do want to visit the target.
       */
      onClick: () => true,
    },
    dictionary: {
      ...en,
      multi_column: multiColumnLocales.en,
    },
    initialContent: initialContent?.length
      ? (initialContent as unknown as SchemaPartialBlock[])
      : undefined,
    uploadFile: async (file: File) => {
      // Validate before upload (images/video/docs — the library allowlist).
      const error = validateLibraryFile(file);
      if (error) throw new Error(error);

      // Route through the shared library uploader so dropped/pasted files land
      // in the gallery (with a thumbnail + name) and are usage-tracked against
      // the post — and so videos are transcoded + poster-captured like every
      // other path — then hand the public URL back to BlockNote for the block.
      const result = await uploadLibraryMedia(file);
      if (!result.fileUrl) throw new Error("Upload failed - no URL returned");

      // Returning an OBJECT rather than the URL string, so images arrive with
      // alt text already drafted. BlockNote spreads this straight into
      // `updateBlock` as a partial BLOCK (not as props), which is why `props`
      // is explicit here — and why `name` must be set too: the drag/paste path
      // only fills in `url` when handed a bare string.
      const props: Record<string, string> = {
        url: result.fileUrl,
        name: file.name,
      };
      // Only the image block has an `alt` prop — the same uploader serves
      // video, audio and file blocks, and handing those an unknown prop would
      // be a schema error.
      if (file.type.startsWith("image/")) {
        // "" for camera-roll and screenshot names, so the author is prompted
        // for real alt text instead of nudged into keeping "IMG_5169".
        props.alt = altFromFileName(file.name);
      }
      return { props };
    },
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  // The block where "/" was typed — we insert the picked media after it.
  const insertAfterRef = useRef<string | null>(null);

  // Custom slash-menu entry that inserts an author-controlled table of
  // contents block (live outline in the editor; anchor links when published).
  const tocSlashItem: DefaultReactSuggestionItem = {
    title: "Table of contents",
    subtext: "Linked outline of this article's headings",
    aliases: ["toc", "contents", "outline"],
    group: "Basic blocks",
    icon: <TocIcon />,
    onItemClick: () => {
      const current = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{ type: "tableOfContents" } as SchemaPartialBlock],
        current.id,
        "after",
      );
      // The slash trigger leaves an empty paragraph — drop it so the block
      // takes its place cleanly (same cleanup as the media picker insert).
      if (
        current.type === "paragraph" &&
        (current.content as unknown[]).length === 0
      ) {
        editor.removeBlocks([current.id]);
      }
    },
  };

  // Custom slash-menu entry for a FAQ question. Each insert is ONE Q&A pair:
  // the block's own text is the question, and anything nested under it is the
  // answer. Consecutive pairs render as a single accordion card.
  const faqSlashItem: DefaultReactSuggestionItem = {
    title: "FAQ question",
    subtext: "Collapsible Q&A — also emits FAQ schema for search engines",
    aliases: ["faq", "question", "accordion", "qa", "q&a"],
    group: "Basic blocks",
    icon: <FaqIcon />,
    onItemClick: () => {
      const current = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [
          {
            type: "faqItem",
            children: [{ type: "paragraph" }],
          } as SchemaPartialBlock,
        ],
        current.id,
        "after",
      );
      if (
        current.type === "paragraph" &&
        (current.content as unknown[]).length === 0
      ) {
        editor.removeBlocks([current.id]);
      }
    },
  };

  // Custom slash-menu entry for the sanitized raw-HTML block (embeds or
  // hand-written markup).
  const htmlSlashItem: DefaultReactSuggestionItem = {
    title: "Custom HTML",
    subtext: "Embed (YouTube, Maps…) or hand-written markup",
    aliases: ["html", "embed", "iframe", "custom"],
    group: "Media",
    icon: <CodeIcon />,
    onItemClick: () => {
      const current = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{ type: "htmlBlock" } as SchemaPartialBlock],
        current.id,
        "after",
      );
      if (
        current.type === "paragraph" &&
        (current.content as unknown[]).length === 0
      ) {
        editor.removeBlocks([current.id]);
      }
    },
  };

  // Custom slash-menu entry that opens the media library picker.
  const mediaSlashItem: DefaultReactSuggestionItem = {
    title: "Media library",
    subtext: "Insert an image, video or file from your library",
    aliases: ["media", "library", "gallery", "asset"],
    group: "Media",
    icon: <MediaIcon />,
    onItemClick: () => {
      insertAfterRef.current = editor.getTextCursorPosition().block.id;
      setPickerOpen(true);
    },
  };

  function handlePick(media: MediaItem) {
    const block = blockForMedia(media);
    const refId =
      insertAfterRef.current ?? editor.getTextCursorPosition().block.id;
    editor.insertBlocks([block], refId, "after");
    // The slash trigger leaves an empty paragraph — drop it so the inserted
    // block takes its place cleanly.
    const ref = editor.getBlock(refId);
    if (
      ref &&
      ref.type === "paragraph" &&
      (ref.content as unknown[]).length === 0
    ) {
      editor.removeBlocks([refId]);
    }
    insertAfterRef.current = null;
  }

  return (
    // Provider wraps the whole editor so the link picker — rendered inside the
    // toolbar's portal — can read the targets.
    <LinkTargetsContext.Provider
      value={{ targets: linkTargets, currentPath }}
    >
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => onChange(editor.document as unknown as PartialBlock[])}
        slashMenu={false}
        // Disable the built-in formatting toolbar — we render our own
        // (with a justify button) via FormattingToolbarController below.
        // Without this, BOTH toolbars mount and fight over focus/position,
        // which blurs the editor on click and closes the toolbar.
        formattingToolbar={false}
        // Same deal for the link toolbar: replaced below by the variant
        // with per-link rel (nofollow/sponsored/ugc) toggles.
        linkToolbar={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          floatingUIOptions={SLASH_MENU_FLOATING_OPTIONS}
          getItems={async (query) =>
            filterSuggestionItems(
              combineByGroup(
                getDefaultReactSlashMenuItems(editor),
                getMultiColumnSlashMenuItems(editor),
                [tocSlashItem, faqSlashItem, htmlSlashItem, mediaSlashItem],
              ),
              query,
            )
          }
        />
        {/* Adds a justify button alongside the default left/center/right.
            Component is React-Compiler-exempt (see its `"use no memo"`). */}
        <FormattingToolbarController
          formattingToolbar={FormattingToolbarWithJustify}
        />
        {/* Link toolbar with per-link SEO rel toggles (see LinkToolbarWithRel). */}
        <LinkToolbarController linkToolbar={LinkToolbarWithRel} />
      </BlockNoteView>

      <MediaPickerModal
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePick}
      />
    </LinkTargetsContext.Provider>
  );
}
