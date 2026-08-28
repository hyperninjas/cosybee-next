import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getArticleBySlug } from "@/app/lib/articles";
import { SITE_URL, url } from "@/app/lib/site";

/**
 * Per-article Open Graph card.
 *
 * Renders a branded 1200×630 social card (tilted cover photo + domain pill +
 * title + "Read Blog" button) with `next/og`, then transcodes the PNG to a
 * compressed JPEG via sharp so it stays under WhatsApp's ~300 KB link-preview
 * limit (Satori only emits PNG, which for a photo would blow past it — and
 * WhatsApp shows NO image when the file is too big, unlike Facebook). The
 * article's `og:image` points here.
 */

const SIZE = { width: 1200, height: 630 };
const MAX_BYTES = 280_000; // headroom under WhatsApp's ~300 KB
const DOMAIN = (() => {
  try {
    return new URL(SITE_URL).host.replace(/^www\./, "");
  } catch {
    return "energiebee.com";
  }
})();

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
  let out: Buffer;
  try {
    const png = Buffer.from(await card.arrayBuffer());
    let quality = 82;
    out = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
    while (out.length > MAX_BYTES && quality > 40) {
      quality -= 12;
      out = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
    }
  } catch {
    return Response.redirect(url("/api/og"), 307);
  }

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
