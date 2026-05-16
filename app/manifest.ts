import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./lib/site";

/**
 * PWA manifest served at /manifest.webmanifest. The browser pulls
 * this when prompting "Add to Home Screen" and when the app is
 * installed as a standalone PWA.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    categories: ["productivity", "utilities", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    // Screenshots unlock the richer PWA install UI in Chrome / Edge.
    // Need at least one wide (desktop) and one non-wide (mobile).
    screenshots: [
      {
        src: "/api/screenshot/wide",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: `${SITE_NAME} — smart home energy dashboard`,
      },
      {
        src: "/api/screenshot/narrow",
        sizes: "640x1136",
        type: "image/png",
        form_factor: "narrow",
        label: `${SITE_NAME} — mobile app`,
      },
    ],
  };
}
