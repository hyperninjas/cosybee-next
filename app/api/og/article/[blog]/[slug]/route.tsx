import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getArticleBySlug } from "@/app/lib/articles";
import { validImageOrNull } from "@/app/lib/article-types";
import { SITE_URL, url } from "@/app/lib/site";

/**
 * Per-article Open Graph image. Every article's `og:image` points here, and
 * this route decides what that means:
 *
 * 1. The article specifies its own OG image → that image, at its own framing.
 *    See `shareImage`.
 * 2. Otherwise → a branded 1200×630 card (tilted cover photo + domain pill +
 *    title + "Read Blog" button) rendered with `next/og`.
 *
 * Either way the bytes go out as a JPEG under WhatsApp's ~300 KB link-preview
 * limit, because WhatsApp shows NO image when the file is too big rather than
 * scaling it down like Facebook. For the card that also means transcoding
 * Satori's output, since it only emits PNG and a photo in PNG blows the budget.
 *
 * Keeping both behind one URL means the tag never changes when an editor adds
 * or clears a share image, so links crawlers cached long ago still resolve to
 * the current picture.
 */

const SIZE = { width: 1200, height: 630 };
const MAX_BYTES = 280_000; // headroom under WhatsApp's ~300 KB
/** Longest edge for a passed-through share image. 1200 is the width every
 *  major crawler renders a large card at; past that is bytes nobody sees. */
const MAX_EDGE = 1200;
/** Formats every major crawler decodes. WebP is the notable absentee: Facebook
 *  handles it, X and LinkedIn are unreliable with it, so it gets transcoded. */
const CRAWLER_SAFE = new Set(["jpeg", "png"]);
const DOMAIN = (() => {
  try {
    return new URL(SITE_URL).host.replace(/^www\./, "");
  } catch {
    return "energiebee.com";
  }
})();

/** Encode to JPEG, stepping quality down until it fits the byte budget. */
async function compressToLimit(pipeline: sharp.Sharp): Promise<Buffer> {
  let quality = 82;
  // `clone` per attempt: an output call consumes the pipeline, and re-running
  // the decode/resize from scratch each time would cost far more than it saves.
  let out = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
  while (out.length > MAX_BYTES && quality > 40) {
    quality -= 12;
    out = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  return out;
}

/**
 * Serve an article's own OG image — the editor's chosen file, not a rendition
 * of it inset into the branded card.
 *
 * Passed through byte-for-byte when it's already a JPEG or PNG inside the size
 * budget, so a well-prepared image reaches crawlers untouched and lossless.
 * Only an image that would actually fail gets rebuilt: WebP and AVIF, which X
 * and LinkedIn render unreliably; SVG, which almost nothing accepts as
 * og:image; and anything over WhatsApp's limit, where the preview is dropped
 * entirely rather than shown scaled down.
 *
 * Aspect ratio is preserved — cropping to 1200×630 is the card's job, and the
 * whole point here is that the editor picked this framing. Returns null if the
 * source can't be read, so the caller can fall back to the generated card.
 */
async function shareImage(
  src: string,
): Promise<{ body: Buffer; type: string } | null> {
  const abs = /^https?:\/\//i.test(src) ? src : url(src);
  try {
    const res = await fetch(abs);
    if (!res.ok) return null;
    const raw = Buffer.from(await res.arrayBuffer());

    const { format, width, height } = await sharp(raw).metadata();
    const fits = raw.length <= MAX_BYTES;
    const small = (width ?? 0) <= MAX_EDGE && (height ?? 0) <= MAX_EDGE;
    if (format && CRAWLER_SAFE.has(format) && fits && small) {
      return { body: raw, type: `image/${format}` };
    }

    const pipeline = sharp(raw, { density: 300 })
      // EXIF orientation is applied on decode and then dropped, so a phone
      // photo would otherwise re-encode sideways.
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      // JPEG carries no alpha, and sharp mattes transparency onto black —
      // which turns a logo on a clear background into a black slab.
      .flatten({ background: "#ffffff" });
    return { body: await compressToLimit(pipeline), type: "image/jpeg" };
  } catch {
    return null;
  }
}

/** Shared cache policy: a card only changes when the article does. */
function imageResponse(body: Buffer, type: string): Response {
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

/** The cover is drawn at 430×500, so 2× keeps it crisp at a sane payload. */
const COVER = { width: 860, height: 1000 };

/**
 * Fetch a cover and inline it as a data URL (null if it can't be loaded).
 *
 * Always re-encoded to JPEG through sharp, never passed through raw. Satori
 * accepts only PNG/APNG/JPEG/GIF/SVG and *throws* on anything else — WebP and
 * AVIF included, which it sniffs by magic bytes purely to reject. That throw
 * lands inside `ImageResponse`'s stream, so it surfaced as an empty 500 from
 * this route and the article shipped with no og:image at all (a hard fail:
 * every article with a .webp cover had no share card anywhere). Any
 * media-library upload can end up here, so normalise the format rather than
 * branch on it. Resizing is the other half — raw covers run to several MB and
 * base64 adds a third again on top, all of which Satori has to decode.
 */
async function loadImage(src: string | null): Promise<string | null> {
  if (!src) return null;
  const abs = /^https?:\/\//i.test(src) ? src : url(src);
  try {
    const res = await fetch(abs);
    if (!res.ok) return null;
    // `density` bites on vector input only, where sharp would otherwise
    // rasterise an SVG cover at a blurry 72dpi. Ignored for raster formats.
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()), {
      density: 300,
    })
      // Centre crop, matching the `objectFit: "cover"` Satori was applying to
      // the full-size image, so cards that already render are untouched.
      .resize(COVER.width, COVER.height, { fit: "cover" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ blog: string; slug: string }> },
) {
  const { blog, slug } = await params;
  if (blog !== "hive" && blog !== "learn") {
    return new Response("Not found", { status: 404 });
  }

  const article = await getArticleBySlug(blog, slug);
  if (!article) return Response.redirect(url("/api/og"), 307);

  // An article that specifies its own OG image shares as that image. Both
  // branches answer on this one URL so the choice stays server-side: an editor
  // can add or clear a share image and the tag crawlers already cached still
  // resolves to the right picture.
  const explicit = validImageOrNull(article.ogImage);
  if (explicit) {
    const direct = await shareImage(explicit);
    // Null means the file couldn't be read at all — fall through to the
    // generated card rather than serve nothing.
    if (direct) return imageResponse(direct.body, direct.type);
  }

  // The cover photo for the tilted card (resolved: cover → og → placeholder).
  const cover = await loadImage(article.coverImage);
  const rawTitle = article.seoTitle || article.title;
  const title =
    rawTitle.length > 92 ? `${rawTitle.slice(0, 91).trimEnd()}…` : rawTitle;
  const titleSize = title.length > 78 ? 46 : title.length > 54 ? 52 : 58;

  const card = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background:
            "radial-gradient(120% 120% at 30% 20%, #f7f5f1 0%, #efece5 55%, #e4ded3 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Left: tilted cover card. Dropped entirely when the cover can't be
            loaded — an empty 46% column just reads as a lopsided blank card. */}
        {cover ? (
          <div
            style={{
              display: "flex",
              width: "46%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              width={430}
              height={500}
              alt=""
              style={{
                objectFit: "cover",
                borderRadius: 24,
                border: "8px solid #ffffff",
                boxShadow: "0 30px 70px rgba(40,30,10,0.28)",
                transform: "rotate(-5deg)",
              }}
            />
          </div>
        ) : null}

        {/* Right: domain + title + CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: cover ? "54%" : "100%",
            height: "100%",
            paddingRight: 72,
            paddingLeft: cover ? 12 : 72,
            gap: 30,
          }}
        >
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                background: "#e7e4dd",
                color: "#5a5750",
                fontSize: 26,
                fontWeight: 500,
                padding: "10px 26px",
                borderRadius: 9999,
              }}
            >
              {DOMAIN}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 800,
              color: "#171717",
              lineHeight: 1.12,
              letterSpacing: -1.5,
            }}
          >
            {title}
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                background: "#111111",
                color: "#ffffff",
                fontSize: 28,
                fontWeight: 700,
                padding: "18px 42px",
                borderRadius: 9999,
              }}
            >
              Read Blog
            </div>
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  );

  // Satori → PNG → compressed JPEG (≤ WhatsApp's limit).
  //
  // Guarded because Satori defers its work to this `arrayBuffer()` call, so
  // anything it dislikes throws *here* rather than at construction. Unhandled,
  // that returns a bodyless 500 — and a 500 on og:image is worse than a plain
  // card: crawlers cache the miss, so the article shares as a bare link long
  // after the cause is fixed. Fall back to the generic card instead, the same
  // way a missing article does above.
  try {
    const png = Buffer.from(await card.arrayBuffer());
    return imageResponse(await compressToLimit(sharp(png)), "image/jpeg");
  } catch {
    return Response.redirect(url("/api/og"), 307);
  }
}
