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

/**
 * Inject stable `id`s into the article HTML's h2/h3 headings and return
 * a flat table-of-contents. Pure string processing over server-rendered HTML.
 */
export function buildToc(html: string): { html: string; items: TocItem[] } {
  const items: TocItem[] = [];
  const seen = new Set<string>();

  const out = html.replace(
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

  return { html: out, items };
}
