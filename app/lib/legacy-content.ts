/**
 * Render legacy article content format to HTML.
 *
 * Legacy format:
 * {
 *   sections: [
 *     { heading: "...", paragraphs: ["...", "..."] },
 *     { heading: "...", blocks: ["...", { items: ["...", "..."] }] }
 *   ],
 *   cta: { label: "..." }
 * }
 */

type LegacyBlock = string | { items: string[] };

interface LegacySection {
  heading?: string;
  paragraphs?: string[];
  blocks?: LegacyBlock[];
}

interface LegacyContent {
  sections?: LegacySection[];
  cta?: { label: string };
}

/** Escape HTML special characters. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Convert legacy contentJson to HTML. */
export function renderLegacyContent(contentJson: unknown): string | null {
  if (!contentJson || typeof contentJson !== "object") return null;

  const content = contentJson as LegacyContent;
  if (!content.sections || !Array.isArray(content.sections)) return null;

  const parts: string[] = [];

  for (const section of content.sections) {
    // Render heading
    if (section.heading) {
      parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    }

    // Render paragraphs (legacy format)
    if (section.paragraphs && Array.isArray(section.paragraphs)) {
      for (const para of section.paragraphs) {
        if (typeof para === "string" && para.trim()) {
          parts.push(`<p>${escapeHtml(para)}</p>`);
        }
      }
    }

    // Render blocks (can be strings or objects with items)
    if (section.blocks && Array.isArray(section.blocks)) {
      for (const block of section.blocks) {
        if (typeof block === "string" && block.trim()) {
          // Plain text block
          parts.push(`<p>${escapeHtml(block)}</p>`);
        } else if (block && typeof block === "object" && "items" in block) {
          // Bullet list
          const items = (block as { items: string[] }).items;
          if (Array.isArray(items) && items.length > 0) {
            parts.push("<ul>");
            for (const item of items) {
              if (typeof item === "string" && item.trim()) {
                parts.push(`<li>${escapeHtml(item)}</li>`);
              }
            }
            parts.push("</ul>");
          }
        }
      }
    }
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

/** Check if contentJson is in legacy format (has sections array). */
export function isLegacyContent(contentJson: unknown): boolean {
  if (!contentJson || typeof contentJson !== "object") return false;
  const content = contentJson as Record<string, unknown>;
  return "sections" in content && Array.isArray(content.sections);
}
