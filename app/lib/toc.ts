/** Turn arbitrary text into a URL-safe slug. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type TocItem = { id: string; text: string; level: number };

/**
 * Stateful anchor-id assigner: slugifies each heading text in document order,
 * deduping repeats as `-2`, `-3`, … This is THE algorithm for heading anchor
 * ids — `buildToc` uses it to stamp ids on the published headings, and the
 * editor's "Link to section" picker (Editor.tsx) uses it to predict those
 * same ids from the document, so hand-inserted `#anchors` always resolve.
 */
export function createAnchorAssigner(): (text: string) => string {
  const seen = new Set<string>();
  return (text: string) => {
    let id = slugify(text) || "section";
    let n = 2;
    while (seen.has(id)) id = `${slugify(text)}-${n++}`;
    seen.add(id);
    return id;
  };
}

/**
 * Wrap each bare `<table>` from the lossy BlockNote export in a scroll
 * container (`.article-table-wrap`, styled in globals.css). The editor gets
 * this from BlockNote's own `.tableWrapper`; the export ships the table naked,
 * so without this an author-resized table wider than the article column would
 * overflow the page on small screens. Safe as a plain string replace —
 * BlockNote tables can't nest. Any margin/padding on the table moves to the
 * wrapper (see inside).
 */
export function wrapArticleTables(html: string): string {
  return html
    .replace(/<table(?=[\s>])([^>]*)>/g, (_m, attrs: string) => {
      // Per-block spacing (blocknoteSchema.ts → withSpacing) is exported as
      // margin/padding on the <table>. Moved to the wrapper, because the
      // wrapper is the block in the article's flow: a margin left on the table
      // would stack on top of the default gap instead of replacing it, and
      // padding does nothing on a `border-collapse: collapse` table.
      const style = /\sstyle="([^"]*)"/.exec(attrs);
      if (!style) return `<div class="article-table-wrap"><table${attrs}>`;
      const decls = style[1]
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean);
      // Only the exact form the spacing dialog writes (`margin-top: 24px`).
      // Anything else — `margin: 0 auto` centring a table hand-written in an
      // HTML block, say — belongs to the table and stays on it.
      const isSpacing = (d: string) =>
        /^(?:margin|padding)-(?:top|right|bottom|left):\s*-?\d+px$/i.test(d);
      const moved = decls.filter(isSpacing);
      const kept = decls.filter((d) => !isSpacing(d));
      const tableAttrs = attrs.replace(
        style[0],
        kept.length ? ` style="${kept.join("; ")}"` : "",
      );
      const wrapStyle = moved.length ? ` style="${moved.join("; ")}"` : "";
      return `<div class="article-table-wrap"${wrapStyle}><table${tableAttrs}>`;
    })
    .replace(/<\/table>/g, "</table></div>");
}

/**
 * Decode the HTML entities the BlockNote export produces in text content
 * (`&amp;` etc). Without this, a heading like "Costs & savings" slugified to
 * "costs-amp-savings" (the entity leaked into the id) and the sidebar TOC
 * displayed the literal "&amp;". Numeric entities first so "&amp;#39;"-style
 * double encodings can't decode twice.
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Inject stable `id`s into the article HTML's h2/h3 headings and return
 * a flat table-of-contents. Pure string processing over server-rendered HTML.
 *
 * Also populates any author-inserted `tableOfContents` blocks: their HTML
 * export is an EMPTY `<div class="article-toc"></div>` placeholder (the
 * headless server export can't see sibling blocks), which gets filled here
 * with links to the ids just injected — so the in-article TOC and the heading
 * anchors can never drift apart. A placeholder in an article with no
 * headings stays empty (hidden via `.article-toc:empty` in globals.css).
 */
export function buildToc(html: string): { html: string; items: TocItem[] } {
  const items: TocItem[] = [];
  const assignAnchor = createAnchorAssigner();

  let out = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g,
    (_match, tag: string, attrs: string, inner: string) => {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
      if (!text) return _match;
      const id = assignAnchor(text);
      items.push({ id, text, level: tag === "h2" ? 2 : 3 });
      // Don't duplicate an id if one is somehow already present.
      const attrsWithId = /\sid=/.test(attrs) ? attrs : `${attrs} id="${id}"`;
      return `<${tag}${attrsWithId}>${inner}</${tag}>`;
    },
  );

  if (items.length > 0) {
    const list =
      `<p class="article-toc-title">Contents</p><ul>` +
      items
        .map(
          (i) =>
            `<li data-level="${i.level}"><a href="#${i.id}">${escapeHtml(i.text)}</a></li>`,
        )
        .join("") +
      `</ul>`;
    out = out.replace(
      /<div class="article-toc">\s*<\/div>/g,
      `<div class="article-toc">${list}</div>`,
    );
  }

  return { html: out, items };
}
