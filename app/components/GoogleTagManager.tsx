import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Tag Manager container.
 *
 * Renders nothing unless we're in production AND a container ID is set, so
 * dev/staging stay tracking-free and this is a safe no-op until the env var is
 * configured.
 *
 * Consent Mode: GTM shares `window.dataLayer` with the GA4 tag in Analytics.tsx,
 * which sets all consent signals to `denied` by default `beforeInteractive` —
 * before this loader runs (`afterInteractive`). So any consent-gated tags you
 * add inside the GTM container stay gated until Consently grants consent.
 *
 * NOTE: Do NOT add a GA4 configuration tag inside this container — GA4 is
 * already loaded directly by Analytics.tsx, and a second GA4 tag here would
 * double-count every event. Use GTM for other tags (ads, pixels, etc.).
 *
 * The <noscript> fallback for no-JS users is exported separately and must be
 * placed immediately after the opening <body> tag (see app/layout.tsx).
 */
export default function GoogleTagManager() {
  if (process.env.NODE_ENV !== "production" || !GTM_ID) return null;

  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

/**
 * GTM <noscript> iframe fallback. Must render immediately after the opening
 * <body> tag. No-op outside production / when the container ID is unset.
 */
export function GoogleTagManagerNoScript() {
  if (process.env.NODE_ENV !== "production" || !GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
