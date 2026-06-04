import { ImageResponse } from "next/og";
import { url } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };

/** Make a possibly-relative asset path absolute so satori can fetch it. */
function absolute(src: string): string {
  return /^https?:\/\//i.test(src) ? src : url(src);
}

/**
 * Fetch an image and return it as a data URL, or null if it can't be loaded.
 * Done here (rather than letting satori fetch `<img src>` directly) so a
 * missing/unreachable cover degrades to the plain branded card instead of
 * throwing and breaking the OG route / build.
 */
async function loadImage(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    const res = await fetch(absolute(src));
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Branded social card for an article: the cover photo as the background (when
 * available) under a dark gradient, with the energiebee mark, category chip,
 * and title on top. Falls back to a solid brand background when there's no
 * usable cover image.
 */
export async function renderArticleOg({
  title,
  category,
  blog,
  coverImage,
}: {
  title: string;
  category: string;
  blog: string;
  coverImage?: string | null;
}) {
  const cover = await loadImage(coverImage);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1115",
          padding: 72,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* cover photo background */}
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {/* dark gradient overlay so text stays legible over any photo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: cover
              ? "linear-gradient(180deg, rgba(15,17,21,0.45) 0%, rgba(15,17,21,0.82) 100%)"
              : "transparent",
          }}
        />

        <div
          style={{ position: "relative", display: "flex", alignItems: "center" }}
        >
          <div style={{ fontSize: 36, fontWeight: 800 }}>energiebee</div>
          <div
            style={{ fontSize: 24, color: "#FF8A7A", marginLeft: 14 }}
          >{`· ${blog}`}</div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", marginBottom: 28 }}>
            <div
              style={{
                background: "#1f2630",
                color: "#9fd3ff",
                borderRadius: 999,
                padding: "8px 22px",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {category}
            </div>
          </div>
          <div
            style={{
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.08,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            fontSize: 26,
            color: "#cbd2dc",
          }}
        >
          energiebee.com
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
