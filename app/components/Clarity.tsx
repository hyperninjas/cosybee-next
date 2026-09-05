import Script from "next/script";
import { IS_PRODUCTION_DEPLOYMENT } from "@/app/lib/site";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

/**
 * Microsoft Clarity — session replay and heatmaps.
 *
 * Renders nothing unless this is the production DEPLOYMENT and a project ID
 * is set. The gate is IS_PRODUCTION_DEPLOYMENT, not `NODE_ENV`: `next build`
 * sets NODE_ENV to "production" for the sandbox too, and the sandbox does set
 * NEXT_PUBLIC_CLARITY_PROJECT_ID — to the SAME project as production — so this
 * component's old promise that "dev/staging stay tracking-free" was not being
 * kept: sandbox sessions were recorded into the live Clarity project.
 *
 * `afterInteractive` rather than `lazyOnload`: Clarity records the session from
 * the moment it boots, so deferring to browser idle would drop the first clicks
 * and scrolls of every visit. The tag it injects is itself `async`, so this
 * doesn't block hydration.
 *
 * CONSENT: unlike GA, Clarity is not wired into Google Consent Mode, so the
 * `denied` defaults in Analytics.tsx do NOT gate it. Clarity gates itself only
 * if "Cookie consent" is switched on in the Clarity dashboard (Settings →
 * Setup), which makes it withhold cookies until it receives `clarity('consent')`.
 * Turn that on and call `clarity('consent')` from the Consently accept callback
 * if this site needs Clarity to be consent-gated for GDPR/PECR.
 */
export default function Clarity() {
  if (!IS_PRODUCTION_DEPLOYMENT || !CLARITY_ID) return null;

  return (
    <Script id="clarity-loader" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}
