import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "./lib/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default Open Graph image served at /opengraph-image, used by Twitter,
 * Facebook, LinkedIn, iMessage, Slack, etc. when the site URL is shared.
 * Per-route pages can override by adding their own opengraph-image.tsx.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 50%, #2a2410 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg
            viewBox="0 0 57 40"
            width="64"
            height="45"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M56.39 18.67 52 11.06a2.4 2.4 0 0 0-2.3-1.32H40.9c-.4 0-.78.08-1.11.24a2.4 2.4 0 0 0-.33-1.04L35.07 1.33A2.4 2.4 0 0 0 32.77 0h-8.79a2.4 2.4 0 0 0-2.3 1.33L17.29 8.94a2.4 2.4 0 0 0-.33 1.04 2.4 2.4 0 0 0-1.12-.24H7.05a2.4 2.4 0 0 0-2.3 1.33L.35 18.67a2.4 2.4 0 0 0 0 2.66l4.4 7.61a2.4 2.4 0 0 0 2.3 1.32h8.79c.4 0 .78-.09 1.12-.25.05.37.16.72.33 1.04l4.39 7.61A2.4 2.4 0 0 0 23.98 40h8.79a2.4 2.4 0 0 0 2.3-1.33l4.4-7.61c.18-.32.3-.67.33-1.03.34.16.71.24 1.11.24h8.79a2.4 2.4 0 0 0 2.3-1.32l4.39-7.61a2.4 2.4 0 0 0 0-2.66Z"
              fill="#D7C638"
            />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
            {SITE_NAME}
          </span>
        </div>

        {/* headline */}
        <div
          style={{
            marginTop: "60px",
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: "900px",
          }}
        >
          {SITE_TAGLINE}
        </div>

        {/* accent line */}
        <div
          style={{
            marginTop: "40px",
            fontSize: 32,
            color: "#D7C638",
            fontWeight: 500,
          }}
        >
          Save up to £300 a year vs tado.
        </div>
      </div>
    ),
    { ...size },
  );
}
