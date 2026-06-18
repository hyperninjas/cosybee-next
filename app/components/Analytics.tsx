import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 with Google Consent Mode v2.
 *
 * Renders nothing unless we're in production AND a measurement ID is set, so
 * dev/staging stay tracking-free and the component is a safe no-op until the
 * env var is configured.
 *
 * Consent Mode: we set ALL consent to `denied` by default (beforeInteractive,
 * so it runs before GA loads). Until the visitor accepts via the Consently
 * banner, GA runs in cookieless "consent mode" — no analytics cookies, only
 * privacy-preserving pings. Consently (a Google-certified CMP) updates consent
 * with `gtag('consent', 'update', …)` once the user accepts, at which point
 * full measurement begins. This keeps us GDPR/PECR-compliant without extra
 * wiring.
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production" || !GA_ID) return null;

  return (
    <>
      {/* Consent defaults — must execute before the GA library loads. */}
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            security_storage: 'granted',
            wait_for_update: 500
          });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
