/**
 * Deriving a first-draft alt text from a file name.
 *
 * Alt text is required on body images, so every image should arrive with the
 * field already filled in where we can honestly fill it — an author correcting
 * a suggestion is a far better outcome than an author facing an empty required
 * field on every upload.
 *
 * The catch is that most file names are noise. A camera roll gives you
 * `IMG_5169`, a Mac screenshot gives `Captura de pantalla 2026-07-17 a la(s)
 * 18.19.25.png`, and an AI export gives `ChatGPT Image 7 jul 2026, 19_48_19.png`.
 * Publishing any of those as alt text is exactly the bug this whole feature
 * exists to fix, so a name that matches a known-meaningless pattern yields ""
 * — the author is then prompted for real alt text rather than nudged into
 * accepting rubbish.
 *
 * Names that DO describe the image ("Spain vs Argentina greener energy.png",
 * "worker-bee-symbol.jpg") survive and are tidied into a readable phrase.
 *
 * Client-safe and pure.
 */

/**
 * File-name shapes that carry no descriptive value. Matched against the
 * extension-stripped, separator-normalised name.
 */
const MEANINGLESS_NAME = [
  /^image\s*\d*$/i,
  /^img\s*\d*$/i,
  /^dsc[nf]?\s*\d*$/i, // DSC_0001 / DSCN0001 / DSCF0001 — camera defaults
  /^photo\s*\d*$/i,
  /^picture\s*\d*$/i,
  /^untitled\s*\d*$/i,
  /^unnamed\s*\d*$/i,
  /^download\s*\d*$/i,
  /^screen\s?shot/i,
  /^captura de pantalla/i, // macOS, Spanish locale
  /^bildschirmfoto/i, // macOS, German locale
  /^capture d.?[ée]cran/i, // macOS, French locale
  /^chatgpt image/i,
  /^generated image/i,
  /^pasted image/i,
  /^whatsapp image/i,
  /^\d[\d\s.:-]*$/, // pure timestamps / numbers
  /^[0-9a-f]{8,}$/i, // hashes and uuid-ish blobs
];

/**
 * A readable first-draft alt text from a file name, or "" when the name is
 * meaningless (see `MEANINGLESS_NAME`) — never a raw file name.
 */
export function altFromFileName(fileName: string | null | undefined): string {
  if (!fileName) return "";
  const base = fileName
    .replace(/\.[^./\\]+$/, "") // drop the extension
    .replace(/[_-]+/g, " ") // separators → spaces
    .replace(/\s+/g, " ")
    .trim();

  if (!base) return "";
  if (MEANINGLESS_NAME.some((pattern) => pattern.test(base))) return "";
  // A name is only worth suggesting if it actually contains words.
  if (!/[a-z]{2}/i.test(base)) return "";

  return base.charAt(0).toUpperCase() + base.slice(1);
}
