import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SITE_NAME, SITE_TAGLINE, url } from "@/app/lib/site";
import { OG_COVERS, isOgCoverKey } from "@/app/lib/og-covers";

const SIZE = { width: 1200, height: 630 };
const MAX_BYTES = 280_000; // headroom under WhatsApp's ~300 KB preview limit

/** The navbar lockup (hex + wordmark), drawn white-on-dark. */
const LOGO = "/energieBee-logo-colored-version.svg";
const LOGO_RATIO = 512 / 80;
const LOGO_HEIGHT = 52;

/** Brand yellow — matches the refreshed logo marks in /public. */
const YELLOW = "#EFDF18";

/**
 * Open Graph card for every page that doesn't ship its own image, served at
 * /api/og and referenced by `DEFAULT_OG_IMAGE` / `pageMetadata()` (lib/seo.ts).
 * Used by Twitter, Facebook, LinkedIn, iMessage, Slack, etc.
 *
 * Query params, all filled by `pageMetadata()` from the page's own metadata:
 *   t   headline   (defaults to the site tagline)
 *   d   subtitle   (optional)
 *   bg  cover key  (see lib/og-covers.ts — a key, never a URL, so this route
 *                   can't be pointed at an arbitrary host)
 * So /solar, /heating and /privacy each get a distinct card — page copy over
 * that page's own hero photo — from one template.
 *
 * Why a route handler and NOT the `app/opengraph-image.tsx` file convention:
 * file-based metadata OUTRANKS `generateMetadata`, so a root-level
 * `opengraph-image` would override every page — including blog articles that
 * deliberately set `og:image` to their own card. Serving from a plain route
 * keeps it a metadata-level default that per-page `openGraph.images` beats.
 *
 * Not `force-static`: that config blanks out search params, and the params are
 * the whole point. Each distinct URL is immutable, so it's cached hard instead.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const params = requestUrl.searchParams;
  // Assets are read back from whichever deployment is serving this request —
  // localhost in dev, the preview host on a preview deploy. Resolving against
  // SITE_URL instead would make every environment render production's assets,
  // and 404 on anything not deployed yet.
  const origin = requestUrl.origin;

  const title = clamp(params.get("t")?.trim() || SITE_TAGLINE, 96);
  const subtitle = clamp(params.get("d")?.trim() || "", 150);

  // The bare /api/og (root-layout fallback, no params at all) is the site's
  // own card, so it gets the home hero. A page that passes copy but no `bg`
  // has no hero photo of its own — those keep the plain gradient.
  const bgKey = params.get("bg") ?? (params.has("t") ? "" : "home");
  const [cover, logo] = await Promise.all([
    isOgCoverKey(bgKey) ? loadCover(OG_COVERS[bgKey], origin) : null,
    loadAsset(LOGO, origin),
  ]);

  // Long headlines step down so they stay on ≤3 lines inside the 1040px column.
  const titleSize = title.length > 72 ? 50 : title.length > 46 ? 58 : 66;

  const card = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        // The hero photo when the page has one; otherwise the brand gradient.
        ...(cover
          ? { backgroundImage: `url(${cover})`, backgroundSize: "1200px 630px" }
          : {
              background:
                "linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 50%, #2a2410 100%)",
            }),
      }}
    >
      {/* Scrim — same idea as PageHero's gradient: darkens the photo so the
            copy stays legible whatever the crop happens to contain. */}
      {cover ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            display: "flex",
            background:
              "linear-gradient(105deg, rgba(8,8,6,0.94) 0%, rgba(8,8,6,0.82) 46%, rgba(8,8,6,0.42) 100%)",
          }}
        />
      ) : null}

      {/* logo — the same lockup the navbar uses */}
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          width={Math.round(LOGO_HEIGHT * LOGO_RATIO)}
          height={LOGO_HEIGHT}
          alt={SITE_NAME}
        />
      ) : (
        <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
          {SITE_NAME}
        </span>
      )}

      {/* headline — the page's own social title */}
      <div
        style={{
          marginTop: "48px",
          fontSize: titleSize,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -2,
          maxWidth: "1040px",
        }}
      >
        {title}
      </div>

      {/* accent rule */}
      <div
        style={{
          marginTop: "36px",
          width: "96px",
          height: "6px",
          borderRadius: "9999px",
          backgroundColor: YELLOW,
        }}
      />

      {/* subtitle — the page's own social description */}
      {subtitle ? (
        <div
          style={{
            marginTop: "32px",
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.78)",
            maxWidth: "900px",
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>,
    { ...SIZE },
  );

  // Satori → PNG → compressed JPEG. A photo background blows past WhatsApp's
  // ~300 KB limit as PNG, and WhatsApp shows NO image when the file is too big.
  const png = Buffer.from(await card.arrayBuffer());
  let quality = 82;
  let out = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
  while (out.length > MAX_BYTES && quality > 40) {
    quality -= 12;
    out = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      // Every distinct t/d/bg triple renders the same bytes forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** Fetch a /public asset and inline it as a data URL (null if unavailable). */
async function loadAsset(path: string, origin: string): Promise<string | null> {
  try {
    const res = await fetchAsset(path, origin);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/svg+xml";
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${b64}`;
  } catch {
    return null;
  }
}

/**
 * Same, but down-scaled to card size first. The hero PNGs run 1–8 MB at full
 * resolution; handing Satori that much base64 is slow and pointless when it
 * renders into 1200×630.
 */
async function loadCover(path: string, origin: string): Promise<string | null> {
  try {
    const res = await fetchAsset(path, origin);
    if (!res.ok) return null;
    const resized = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(SIZE.width, SIZE.height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Read a /public asset from this deployment, falling back to the canonical
 *  origin if the self-request fails. */
async function fetchAsset(path: string, origin: string): Promise<Response> {
  try {
    const res = await fetch(new URL(path, origin));
    if (res.ok) return res;
  } catch {
    // fall through to the canonical origin
  }
  return fetch(url(path));
}

/** Trim to `max` characters on a word boundary, with an ellipsis. */
function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
