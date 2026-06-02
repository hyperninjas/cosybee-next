import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded social card for an article (title + category on brand bg). */
export function renderArticleOg({
  title,
  category,
  blog,
}: {
  title: string;
  category: string;
  blog: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800 }}>energiebee</div>
          <div
            style={{ fontSize: 24, color: "#FF8A7A", marginLeft: 14 }}
          >{`· ${blog}`}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
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

        <div style={{ display: "flex", fontSize: 26, color: "#8b94a3" }}>
          energiebee.com
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
