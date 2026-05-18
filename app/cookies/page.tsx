import LegalContainer from "../components/legal/LegalContainer";
import LegalHero from "../components/legal/LegalHero";
// import LegalIllustrationPlaceholder from "../components/legal/LegalIllustrationPlaceholder";
import LegalSection from "../components/legal/LegalSection";
import illustration from "@/public/illustration-cookies.svg";
import Image from "next/image";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Exactly which cookies energiebee places on your device, why we place them, and how to stay in control.",
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
  openGraph: {
    url: "/cookies",
    title: "Cookie Policy — energiebee",
    description:
      "Small files, big transparency — which cookies we place, why, and how to stay in control.",
  },
};

/** Inline monospace token used for cookie names like `session_id`. */
function Cookie({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[13px] text-[#EE3D1A]">
      {children}
    </code>
  );
}

export default function CookiesPage() {
  return (
    <main className="flex-1 bg-white text-black">
      <LegalHero
        label="Cookie Policy"
        title="How We Use Cookies on Our Website"
        subtitle="Small files, big transparency, here's exactly what we place on your device, why, and how you stay in control."
        illustration={
          <Image src={illustration} alt="" className="max-h-111.25 w-auto" />
        }
      />

      <LegalContainer>
        <LegalSection title="What Are Cookies?">
          <p>
            Cookies are small text files placed on your device (computer,
            tablet, or smartphone) when you visit a website. They are widely
            used to make websites work efficiently, remember your preferences,
            and provide information to website owners about how their site is
            being used.
          </p>
          <p>
            Cookies are not viruses or harmful programs. They cannot access
            other files on your device or execute code. They simply store small
            pieces of information that help websites function and improve over
            time.
          </p>
          <p>
            Similar technologies such as pixels, web beacons, and local storage
            work in comparable ways and are also covered by this policy.
          </p>
        </LegalSection>

        <LegalSection title="Who We Are">
          <p>
            This Cookie Policy is published by Energiebee Limited, a company
            registered in England and Wales, with its registered office at:
          </p>
          <p>4 Blackburn Road, Accrington, England, BB5 1HD</p>
          <p>
            For cookie-related enquiries:{" "}
            <a href="mailto:privacy@energiebee.com">privacy@energiebee.com</a>
          </p>
          <p>
            This policy applies to our website at{" "}
            <a href="https://www.energiebee.com">www.energiebee.com</a>{" "}
            (&ldquo;Website&rdquo;). It should be read alongside our{" "}
            <a href="/privacy">Privacy Policy</a> and{" "}
            <a href="/terms">Terms &amp; Conditions</a>.
          </p>
        </LegalSection>

        <LegalSection title="How We Use Cookies">
          <p>We use cookies on our Website to:</p>
          <ul>
            <li>Ensure the Website functions correctly and securely;</li>
            <li>Remember your preferences and settings between visits;</li>
            <li>Understand how visitors find and use our Website;</li>
            <li>Measure the effectiveness of our marketing campaigns;</li>
            <li>Improve the overall experience for our users.</li>
          </ul>
          <p>
            We do not use cookies to collect sensitive personal information such
            as financial details or passwords, and we do not sell cookie data to
            third parties.
          </p>
        </LegalSection>

        <LegalSection title="Types of Cookies We Use">
          <h3>1.1 Strictly Necessary Cookies</h3>
          <p>
            These cookies are essential for the Website to work. Without them,
            core functionality such as account login, checkout, and security
            features would not operate correctly. They cannot be disabled
            through our cookie settings, as doing so would prevent the Website
            from functioning.
          </p>
          <ul>
            <li>
              <Cookie>session_id</Cookie> — Maintains your login session while
              you browse. Duration: Session.
            </li>
            <li>
              <Cookie>cart_token</Cookie> — Protects against cross-site request
              forgery attacks. Duration: Session.
            </li>
            <li>
              <Cookie>cookie_consent</Cookie> — Stores your cookie preferences.
              Duration: 12 months.
            </li>
            <li>
              <Cookie>cart_items</Cookie> — Remembers items in your shopping
              basket. Duration: 7 days.
            </li>
          </ul>
          <p>
            <strong>Legal basis</strong>: Legitimate interests. These cookies
            are technically necessary to provide the Website.
          </p>

          <h3>1.2 Performance &amp; Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our
            Website — which pages are visited most, where users come from, and
            where they encounter issues. All data collected is anonymised or
            aggregated and cannot be used to identify you personally.
          </p>
          <ul>
            <li>
              <Cookie>_ga</Cookie> — Google Analytics. Distinguishes unique
              users. Duration: 2 years.
            </li>
            <li>
              <Cookie>_ga_*</Cookie> — Google Analytics. Stores session state.
              Duration: 2 years.
            </li>
            <li>
              <Cookie>_gid</Cookie> — Google Analytics. Distinguishes users at
              session level. Duration: 24 hours.
            </li>
            <li>
              <Cookie>_gat</Cookie> — Google Analytics. Throttles request rate.
              Duration: 1 minute.
            </li>
          </ul>
          <p>
            <strong>Legal basis</strong>: Consent — these cookies are only set
            if you accept analytics cookies via our cookie banner.
          </p>

          <h3>1.3 Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalisation on
            our Website, such as remembering your region, language, or display
            preferences. If you disable these cookies, some features may not
            work as expected.
          </p>
          <ul>
            <li>
              <Cookie>user_preferences</Cookie> — Remembers your display and
              language settings. Duration: 12 months.
            </li>
            <li>
              <Cookie>region</Cookie> — Stores your selected country or region.
              Duration: 12 months.
            </li>
          </ul>
          <p>
            <strong>Legal basis</strong>: Consent — these cookies are only set
            if you accept functional cookies via our cookie banner.
          </p>

          <h3>1.4 Marketing &amp; Targeting Cookies</h3>
          <p>
            These cookies are used to deliver advertisements and content that
            are more relevant to you and your interests. They may also be used
            to limit how many times you see an advertisement and to measure the
            effectiveness of marketing campaigns. These cookies may track your
            browsing activity across other websites.
          </p>
          <ul>
            <li>
              <Cookie>_fbp</Cookie> — Meta (Facebook). Tracks visits for ad
              targeting. Duration: 3 months.
            </li>
            <li>
              <Cookie>_fbc</Cookie> — Meta (Facebook). Stores click identifier
              for ad attribution. Duration: 3 months.
            </li>
            <li>
              <Cookie>IDE</Cookie> — Google (DoubleClick). Used for targeted
              advertising. Duration: 13 months.
            </li>
            <li>
              <Cookie>NID</Cookie> — Google. Used to show personalised ads.
              Duration: 6 months.
            </li>
          </ul>
          <p>
            <strong>Legal basis</strong>: Consent — these cookies are only set
            if you accept marketing cookies via our cookie banner.
          </p>

          <h3>1.5 Third-Party Cookies</h3>
          <p>
            Some pages on our Website may include content embedded from
            third-party services (such as YouTube videos, social media sharing
            buttons, or maps). These third parties may set their own cookies on
            your device. We do not control these cookies and recommend reviewing
            the privacy and cookie policies of those services directly:
          </p>
          <ul>
            <li>
              <strong>Google</strong>:{" "}
              <a
                href="https://policies.google.com"
                target="_blank"
                rel="noreferrer"
              >
                policies.google.com
              </a>
            </li>
            <li>
              <strong>Meta (Facebook)</strong>:{" "}
              <a
                href="https://www.facebook.com/policies/cookies"
                target="_blank"
                rel="noreferrer"
              >
                www.facebook.com/policies/cookies
              </a>
            </li>
            <li>
              <strong>YouTube</strong>:{" "}
              <a
                href="https://policies.google.com/technologies/cookies"
                target="_blank"
                rel="noreferrer"
              >
                policies.google.com/technologies/cookies
              </a>
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Cookie Duration">
          <p>
            Cookies are either <strong>session cookies</strong> or{" "}
            <strong>persistent cookies</strong>:
          </p>
          <p>
            <strong>Session cookies</strong> are temporary and are deleted from
            your device automatically when you close your browser. They are used
            to manage your activity during a single visit.
          </p>
          <p>
            <strong>Persistent cookies</strong> remain on your device for a set
            period (as specified in Section 4) or until you delete them
            manually. They are used to remember your preferences across multiple
            visits.
          </p>
        </LegalSection>

        <LegalSection title="Your Cookie Choices">
          <p>You have several ways to control cookies:</p>
          <p>
            <strong>Cookie Banner</strong>: When you first visit our Website,
            you will be shown a cookie consent banner. You can choose to accept
            all cookies, accept only essential cookies, or customise your
            preferences by category. You can update your choices at any time by
            clicking the &ldquo;Cookie Settings&rdquo; link in the footer of our
            Website.
          </p>
          <p>
            <strong>Browser Settings</strong>: Most browsers allow you to view,
            manage, block, or delete cookies through their settings. Please note
            that blocking certain cookies may affect the functionality of our
            Website. Here are links to cookie management instructions for common
            browsers:
          </p>
          <ul>
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noreferrer"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                target="_blank"
                rel="noreferrer"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noreferrer"
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noreferrer"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
          <p>
            <strong>Opt-Out Tools</strong>: You can opt out of Google Analytics
            tracking across all websites by installing the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noreferrer"
            >
              Google Analytics Opt-out Browser Add-on
            </a>
            .
          </p>
          <p>
            For interest-based advertising, you can manage your preferences
            through the{" "}
            <a
              href="https://www.youronlinechoices.com"
              target="_blank"
              rel="noreferrer"
            >
              Your Online Choices
            </a>{" "}
            platform.
          </p>
        </LegalSection>

        <LegalSection title="Cookies & the App">
          <p>
            Our Energiebee mobile application (&ldquo;App&rdquo;) does not use
            browser cookies. However, the App does use similar technologies such
            as local storage and device identifiers to:
          </p>
          <ul>
            <li>Keep you logged in between sessions;</li>
            <li>Store your in-app preferences and settings;</li>
            <li>
              Collect anonymised usage analytics to improve the App experience.
            </li>
          </ul>
          <p>
            For full details on data collected by the App, please refer to our{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </LegalSection>

        <LegalSection title="Do Not Track">
          <p>
            Some browsers include a &ldquo;Do Not Track&rdquo; (DNT) feature
            that signals to websites that you do not want to be tracked. There
            is currently no universally agreed standard for how websites should
            respond to DNT signals. At present, our Website does not alter its
            behaviour in response to DNT signals, but you can use the controls
            described in Section 6 to manage your cookie preferences.
          </p>
        </LegalSection>

        <LegalSection title="Changes to This Policy">
          <p>
            We may update this Cookie Policy from time to time to reflect
            changes in the cookies we use, applicable law, or our business
            practices. We will notify you of any significant changes by updating
            the &ldquo;Last updated&rdquo; date at the top of this page and,
            where appropriate, by displaying a new cookie consent banner.
          </p>
          <p>
            We encourage you to review this policy periodically to stay informed
            about how we use cookies.
          </p>
          <p className="mt-8 text-sm text-neutral-500">
            Last updated: May 2026
          </p>
        </LegalSection>
      </LegalContainer>
    </main>
  );
}
