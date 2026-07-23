import QRCode from "qrcode";
import { url } from "@/app/lib/site";

/**
 * Pre-renders the "scan to download" QR as SVG markup. Import this from server
 * components ONLY — it pulls in the qrcode library, which has no business in
 * the client bundle (HeroDownloadCta takes the finished markup as a prop).
 *
 * The code points at /download-app rather than a store listing: scanning on a
 * phone lands on that page's device-aware CTA, so the same code stays correct
 * before and after launch and for both platforms.
 *
 * Both hero surfaces (home + download page) call this so the two QRs can't
 * drift apart. Callers are server components on statically prerendered routes,
 * so this runs at build time.
 */
export function downloadQrSvg(): Promise<string> {
  return QRCode.toString(url("/download-app"), {
    type: "svg",
    // No quiet zone baked in — the white `p-2` wrapper around the SVG provides
    // it (see HeroDownloadCta).
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
