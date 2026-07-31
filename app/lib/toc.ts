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
 * Wrap each bare `<table>` from the lossy BlockNote export in a scroll
 * container (`.article-table-wrap`, styled in globals.css). The editor gets
 * this from BlockNote's own `.tableWrapper`; the export ships the table naked,
 * so without this an author-resized table wider than the article column would
 * overflow the page on small screens. Safe as a plain string replace —
 * BlockNote tables can't nest.
 */
export function wrapArticleTables(html: string): string {
  return html
    .replace(/<table(?=[\s>])/g, '<div class="article-table-wrap"><table')
    .replace(/<\/table>/g, "</table></div>");
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
  const seen = new Set<string>();

  let out = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g,
    (_match, tag: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (!text) return _match;
      let id = slugify(text) || "section";
      let n = 2;
      while (seen.has(id)) id = `${slugify(text)}-${n++}`;
      seen.add(id);
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
