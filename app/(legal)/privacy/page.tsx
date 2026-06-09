import Image from "next/image";
import LegalContainer from "@/app/components/legal/LegalContainer";
import LegalHero from "@/app/components/legal/LegalHero";
// import LegalIllustrationPlaceholder from "@/app/components/legal/LegalIllustrationPlaceholder";
import LegalSection from "@/app/components/legal/LegalSection";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import illustration from "@/public/illustration-privacy-policy.svg";

import type { Metadata } from "next";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy" },
];

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EnergieBee collects, uses, and protects your personal data — clearly written, with full control over your own information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    url: "/privacy",
    title: "Privacy Policy — EnergieBee",
    description:
      "How we handle your data, with full control over your own information.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-white text-black">
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <div className="mx-auto max-w-3xl px-6 pt-8 sm:px-10 sm:pt-12 lg:pt-16">
        <Breadcrumbs items={CRUMBS} />
      </div>
      <LegalHero
        label="Privacy Policy"
        title="Your Privacy Matters to Us"
        subtitle="We believe you should always know what data we collect, why we collect it, and how it's used, with full control over your own information."
        illustration={
          <Image src={illustration} alt="" className="max-h-112.5 w-auto" />
        }
      />

      <LegalContainer>
        <LegalSection title="Who We Are">
          <p>
            This Privacy Policy explains how EnergieBee Limited
            (&ldquo;EnergieBee&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
            &ldquo;our&rdquo;) collects, uses, stores, and protects your
            personal data when you:
          </p>
          <ul>
            <li>
              Purchase and use an EnergieBee energy-saving device
              (&ldquo;Device&rdquo;).
            </li>
            <li>
              Download and use the EnergieBee mobile application
              (&ldquo;App&rdquo;).
            </li>
            <li>
              Visit our website at{" "}
              <a href="https://www.energiebee.com">www.EnergieBee.com</a>{" "}
              (&ldquo;Website&rdquo;).
            </li>
            <li>Contact us for support or any other purpose.</li>
          </ul>
          <p>
            EnergieBee Limited is the data controller responsible for your
            personal data. Our registered office is:
          </p>
          <p>4 Blackburn Road, Accrington, England, BB5 1HD</p>
          <p>
            For privacy-related enquiries:{" "}
            <a href="mailto:privacy@EnergieBee.com">privacy@EnergieBee.com</a>
          </p>
          <p>
            This policy is governed by the UK General Data Protection Regulation
            (UK GDPR) and the Data Protection Act 2018.
          </p>
        </LegalSection>

        <LegalSection title="What Personal Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li>
              <strong>Account &amp; Identity Data</strong>: Your name, email
              address, password (encrypted), and any profile information you
              provide when creating an EnergieBee account.
            </li>
            <li>
              <strong>Contact Data</strong>: Your billing address, delivery
              address, and phone number provided during a purchase or support
              enquiry.
            </li>
            <li>
              <strong>Device &amp; Energy Data</strong>: Energy consumption
              readings, usage patterns, appliance activity data, and device
              status information transmitted from your EnergieBee Device to the
              App. This data is linked to your account and your home, but not to
              your wider identity unless you choose to provide it.
            </li>
            <li>
              <strong>App Usage Data</strong>: Information about how you
              interact with the App, including features used, screens viewed,
              session duration, and in-app settings and preferences.
            </li>
            <li>
              <strong>Technical Data</strong>: Your device type, operating
              system, browser type, IP address, app version, unique device
              identifiers, and crash or error reports.
            </li>
            <li>
              <strong>Transaction Data</strong>: Details of purchases you make
              from us, including payment confirmation, invoice records, and
              order history. We do not store full card details — payments are
              processed securely by our third-party payment providers.
            </li>
            <li>
              <strong>Communications Data</strong>: Records of any
              correspondence between you and EnergieBee, including support
              tickets, emails, and live chat messages.
            </li>
            <li>
              <strong>Marketing Preferences</strong>: Your choices regarding
              receiving marketing communications from us.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="How We Collect Your Data">
          <p>We collect personal data in the following ways:</p>
          <h3>Directly from you when you:</h3>
          <ul>
            <li>Create an account or make a purchase;</li>
            <li>Set up or register your Device;</li>
            <li>Contact our support team;</li>
            <li>Subscribe to our newsletter or marketing communications;</li>
            <li>Respond to surveys or promotions.</li>
          </ul>
          <h3>Automatically when you:</h3>
          <ul>
            <li>Use the App (energy data, usage analytics, technical data);</li>
            <li>
              Visit our Website (cookies, IP address, browsing behaviour);
            </li>
            <li>
              Connect your Device to our platform (device status, energy
              readings).
            </li>
          </ul>
          <h3>From third parties such as:</h3>
          <ul>
            <li>Payment processors confirming transaction status;</li>
            <li>Analytics providers helping us understand App usage;</li>
            <li>Retailers or partners from whom you purchased your Device.</li>
          </ul>
        </LegalSection>

        <LegalSection title="How We Use Your Data">
          <p>We use your personal data for the following purposes:</p>
          <p>
            <strong>To deliver our Services</strong> — Processing your order,
            setting up your account, connecting your Device, and providing you
            with energy metrics through the App. This is necessary to perform
            our contract with you.
          </p>
          <p>
            <strong>To monitor and improve your Device performance</strong> —
            Analysing energy data to provide personalised insights, usage
            reports, and recommendations within the App. This is in our
            legitimate interests to improve the quality of our product.
          </p>
          <p>
            <strong>To manage your account</strong> — Sending you
            account-related communications such as order confirmations,
            invoices, delivery updates, and security alerts. This is necessary
            to perform our contract with you.
          </p>
          <p>
            <strong>To provide customer support</strong> — Responding to your
            queries, troubleshooting Device or App issues, and managing warranty
            or returns. This is in our legitimate interests and to perform our
            contract with you.
          </p>
          <p>
            <strong>To improve our products and services</strong> — Using
            anonymised and aggregated energy data and app usage data to develop
            new features, fix bugs, and enhance the user experience. This is in
            our legitimate interests.
          </p>
          <p>
            <strong>To send marketing communications</strong> — Sending you
            news, offers, and updates about EnergieBee products and services,
            where you have opted in or where we have a legitimate interest to do
            so. You can opt out at any time.
          </p>
          <p>
            <strong>To comply with legal obligations</strong> — Retaining
            transaction records, responding to lawful requests from authorities,
            and meeting our obligations under UK law.
          </p>
          <p>
            <strong>To protect against fraud and misuse</strong> — Monitoring
            for unusual activity, enforcing our Terms &amp; Conditions, and
            maintaining the security of our platform. This is in our legitimate
            interests.
          </p>
        </LegalSection>

        <LegalSection title="Legal Basis for Processing">
          <p>Under UK GDPR, we rely on the following legal bases:</p>
          <p>
            <strong>Contractual necessity</strong> — Processing required to
            fulfil your order, set up your account, and deliver the Services you
            have purchased.
          </p>
          <p>
            <strong>Legitimate interests</strong> — Improving our products,
            preventing fraud, providing customer support, and sending relevant
            marketing to existing customers, where this does not override your
            rights.
          </p>
          <p>
            <strong>Legal obligation</strong> — Complying with applicable laws,
            including tax, consumer protection, and data protection regulations.
          </p>
          <p>
            <strong>Consent</strong> — Where we rely on your consent (for
            example, for optional marketing emails or non-essential cookies),
            you may withdraw that consent at any time without affecting the
            lawfulness of processing based on consent before its withdrawal.
          </p>
        </LegalSection>

        <LegalSection title="Energy Data — Special Considerations">
          <p>
            Your home energy data is sensitive. We take the following
            commitments seriously:
          </p>
          <ul>
            <li>
              Your energy data is used only to provide you with insights through
              the App and to improve EnergieBee products;
            </li>
            <li>
              We will never sell your individual energy data to third parties,
              including energy suppliers, insurers, or advertisers;
            </li>
            <li>
              We may use anonymised and aggregated energy data (which cannot
              identify you) for research, benchmarking, and product development;
            </li>
            <li>
              You can request deletion of your energy data at any time — see
              Section 11 for your rights.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Sharing Your Data">
          <p>
            We do not sell your personal data. We share it only in the following
            circumstances:
          </p>
          <p>
            <strong>Service providers</strong> — Trusted third parties who help
            us operate our business, including cloud hosting providers, payment
            processors, email delivery services, customer support platforms, and
            analytics tools. These providers are contractually bound to process
            your data only on our instructions and in accordance with UK GDPR.
          </p>
          <p>
            <strong>Smart-home integrations</strong> — If you choose to connect
            your EnergieBee Device to third-party smart-home platforms (such as
            Amazon Alexa, Google Home, or Apple HomeKit), limited data will be
            shared with those platforms in accordance with your instructions and
            their own privacy policies.
          </p>
          <p>
            <strong>Legal and regulatory authorities</strong> — Where required
            by law, court order, or to protect the rights, property, or safety
            of EnergieBee, our customers, or others.
          </p>
          <p>
            <strong>Business transfers</strong> — In the event of a merger,
            acquisition, or sale of all or part of our business, your data may
            be transferred to the relevant third party. We will notify you in
            advance of any such transfer.
          </p>
        </LegalSection>

        <LegalSection title="International Data Transfers">
          <p>
            We primarily store and process your data within the United Kingdom.
            Where data is transferred to countries outside the UK, we ensure
            that appropriate safeguards are in place, such as UK adequacy
            regulations or the UK International Data Transfer Agreement (IDTA),
            to protect your data to the same standard as required under UK GDPR.
          </p>
        </LegalSection>

        <LegalSection title="Data Retention">
          <p>
            We retain your personal data only for as long as necessary for the
            purposes it was collected, or as required by law:
          </p>
          <ul>
            <li>
              <strong>Account data</strong> — Retained for the duration of your
              account and for up to 6 years after account closure, to meet legal
              and tax obligations.
            </li>
            <li>
              <strong>Energy &amp; device data</strong> — Retained for as long
              as you are an EnergieBee customer. You may request earlier
              deletion at any time.
            </li>
            <li>
              <strong>Transaction records</strong> — Retained for 7 years in
              accordance with HMRC requirements.
            </li>
            <li>
              <strong>Support communications</strong> — Retained for up to 5
              years after your last interaction.
            </li>
            <li>
              <strong>Marketing data</strong> — Retained until you unsubscribe
              or withdraw consent, or after 2 years of inactivity.
            </li>
          </ul>
          <p>
            When data is no longer needed, it is securely deleted or anonymised.
          </p>
        </LegalSection>

        <LegalSection title="Cookies & Tracking Technologies">
          <p>
            Our Website uses cookies and similar technologies to improve your
            browsing experience and understand how the site is used:
          </p>
          <p>
            <strong>Essential cookies</strong> — Necessary for the Website to
            function correctly. These cannot be disabled.
          </p>
          <p>
            <strong>Analytics cookies</strong> — Help us understand how visitors
            use our Website (e.g. Google Analytics). These are only set with
            your consent.
          </p>
          <p>
            <strong>Marketing cookies</strong> — Used to show you relevant
            advertising. These are only set with your consent.
          </p>
          <p>
            You can manage your cookie preferences at any time via the cookie
            banner on our Website or through your browser settings. For full
            details, please see our <a href="/cookies">Cookie Policy</a>.
          </p>
        </LegalSection>

        <LegalSection title="Your Rights">
          <p>
            Under UK GDPR, you have the following rights in relation to your
            personal data:
          </p>
          <p>
            <strong>Right of access</strong> — You can request a copy of the
            personal data we hold about you.
          </p>
          <p>
            <strong>Right to rectification</strong> — You can ask us to correct
            inaccurate or incomplete data.
          </p>
          <p>
            <strong>Right to erasure</strong> — You can ask us to delete your
            data, subject to certain legal exceptions (e.g. we must keep records
            for tax purposes).
          </p>
          <p>
            <strong>Right to restrict processing</strong> — You can ask us to
            pause processing of your data in certain circumstances.
          </p>
          <p>
            <strong>Right to data portability</strong> — You can request your
            data in a structured, commonly used, machine-readable format.
          </p>
          <p>
            <strong>Right to object</strong> — You can object to processing
            based on legitimate interests or for direct marketing purposes.
          </p>
          <p>
            <strong>Right to withdraw consent</strong> — Where we rely on
            consent, you can withdraw it at any time without affecting prior
            processing.
          </p>
          <p>
            <strong>
              Right not to be subject to automated decision-making
            </strong>{" "}
            — We do not make solely automated decisions that significantly
            affect you.
          </p>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:privacy@EnergieBee.com">privacy@EnergieBee.com</a>.
            We will respond within 30 days. We may need to verify your identity
            before fulfilling a request.
          </p>
        </LegalSection>

        <LegalSection title="Data Security">
          <p>
            We take the security of your personal data seriously and implement
            appropriate technical and organisational measures, including:
          </p>
          <ul>
            <li>Encryption of data in transit (TLS) and at rest;</li>
            <li>Secure, access-controlled cloud infrastructure;</li>
            <li>Regular security assessments and penetration testing;</li>
            <li>Staff training on data protection;</li>
            <li>
              Strict access controls — only authorised personnel can access your
              data, on a need-to-know basis.
            </li>
          </ul>
          <p>
            In the event of a data breach that is likely to affect your rights
            and freedoms, we will notify you and the Information
            Commissioner&rsquo;s Office (ICO) in accordance with our legal
            obligations.
          </p>
        </LegalSection>

        <LegalSection title="Children's Privacy">
          <p>
            Our Services are not directed at children under the age of 18. We do
            not knowingly collect personal data from anyone under 18. If you
            believe a child has provided us with personal data, please contact
            us at{" "}
            <a href="mailto:privacy@EnergieBee.com">privacy@EnergieBee.com</a>{" "}
            and we will delete the information promptly.
          </p>
        </LegalSection>

        <LegalSection title="Links to Third-Party Websites">
          <p>
            Our Website or App may contain links to third-party websites or
            services. We are not responsible for the privacy practices of those
            third parties. We encourage you to read the privacy policy of any
            website or service you visit.
          </p>
        </LegalSection>

        <LegalSection title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, or legal requirements. We will
            notify you of significant changes by email or via a prominent notice
            in the App at least 14 days before the changes take effect. The
            &ldquo;Last updated&rdquo; date at the top of this page will always
            reflect the most recent version.
          </p>
        </LegalSection>

        <LegalSection title="How to Complain">
          <p>
            If you have concerns about how we handle your personal data, please
            contact us first at{" "}
            <a href="mailto:privacy@EnergieBee.com">privacy@EnergieBee.com</a>.
          </p>
          <p>
            If you remain unsatisfied, you have the right to lodge a complaint
            with the Information Commissioner&rsquo;s Office (ICO), the UK data
            protection regulator:
          </p>
          <ul>
            <li>
              <strong>Website</strong>:{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noreferrer">
                ico.org.uk
              </a>
            </li>
            <li>
              <strong>Phone</strong>: +44 (0) 0303 123 1113
            </li>
          </ul>
          <p className="mt-8 text-sm text-neutral-500">
            Last updated: May 2026
          </p>
        </LegalSection>
      </LegalContainer>
    </main>
  );
}
