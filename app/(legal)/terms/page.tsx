import LegalContainer from "@/app/components/legal/LegalContainer";
import LegalHero from "@/app/components/legal/LegalHero";
// import LegalIllustrationPlaceholder from "@/app/components/legal/LegalIllustrationPlaceholder";
import LegalSection from "@/app/components/legal/LegalSection";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import illustration from "@/public/illustration-terms-conditions.svg";
import Image from "next/image";

import type { Metadata } from "next";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Terms & Conditions", path: "/terms" },
];

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Everything you need to know before you begin: your rights, our responsibilities, and how EnergieBee works for you.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    url: "/terms",
    title: "Terms & Conditions — EnergieBee",
    description:
      "Your rights, our responsibilities, and how EnergieBee works for you.",
  },
};

export default function TermsPage() {
  return (
    <main className="flex-1 bg-white text-black">
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <div className="mx-auto max-w-3xl px-6 pt-8 sm:px-10 sm:pt-12 lg:pt-16">
        <Breadcrumbs items={CRUMBS} />
      </div>
      <LegalHero
        label="Terms & Conditions"
        title="Everything You Need to Know Before You Begin"
        subtitle="Understand your rights, our responsibilities, and how EnergieBee works for you, clearly written, no hidden surprises."
        illustration={
          <Image src={illustration} alt="" className="max-h-90 w-auto" />
        }
      />

      <LegalContainer>
        <LegalSection title="Introduction">
          <p>
            These Terms and Conditions (&ldquo;Terms&rdquo;) govern your use of
            the products, services, mobile application, and website operated by
            EnergieBee Limited (&ldquo;EnergieBee&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a company registered in
            England and Wales with its registered office at 6 Blackburn Road,
            Accrington, England, BB5 1HD.
          </p>
          <p>
            By purchasing an EnergieBee device, creating an account, or using
            the EnergieBee mobile application (&ldquo;App&rdquo;), you
            (&ldquo;Customer&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;)
            agree to be bound by these Terms in full. If you do not agree, you
            must not use our products or services.
          </p>
          <p>
            These Terms should be read alongside our{" "}
            <a href="/privacy">Privacy Policy</a> and{" "}
            <a href="/cookies">Cookie Policy</a>, which are incorporated by
            reference.
          </p>
        </LegalSection>

        <LegalSection title="Definitions">
          <ul>
            <li>
              <strong>Device</strong> — Any EnergieBee hardware product
              purchased from us, including home energy control units and
              associated components.
            </li>
            <li>
              <strong>App</strong> — The EnergieBee mobile application available
              on iOS and Android platforms.
            </li>
            <li>
              <strong>EnergieBee</strong> — EnergieBee Limited, our group,
              dealer, software updates, and any related support services
              provided by EnergieBee.
            </li>
            <li>
              <strong>Account</strong> — The registered user account you create
              to access the App and manage your Device.
            </li>
            <li>
              <strong>Subscription</strong> — Any recurring paid plan that
              grants access to premium features within the App.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Eligibility">
          <p>
            <strong>1.1</strong> You must be at least 18 years of age to
            purchase a Device or create an Account.
          </p>
          <p>
            <strong>1.2</strong> By agreeing to these Terms, you confirm that:
          </p>
          <ul>
            <li>
              You are a resident of the United Kingdom or another country where
              our Services are lawfully available.
            </li>
            <li>
              You have the legal capacity to enter into a binding contract.
            </li>
            <li>
              All information you provide to us is accurate and up to date.
            </li>
          </ul>
          <p>
            <strong>1.3</strong> Our Services are intended for domestic,
            residential use of any company or business purposes unless otherwise
            agreed with us in writing.
          </p>
        </LegalSection>

        <LegalSection title="Purchasing a Device">
          <p>
            <strong>2.1</strong> All orders placed through our website or
            authorised retailers are subject to acceptance by us. We reserve the
            right to refuse or cancel any order at our discretion.
          </p>
          <p>
            <strong>2.2</strong> Prices are displayed in Great British Pounds
            (GBP) and are inclusive of VAT unless otherwise stated. We reserve
            the right to change prices at any time, but changes will not affect
            orders already confirmed.
          </p>
          <p>
            <strong>2.3</strong> Title (ownership) of the Device passes to you
            upon receipt of full payment. Risk of damage or loss passes to you
            upon delivery.
          </p>
          <p>
            <strong>2.4</strong> Delivery timescales are estimates only. We are
            not liable for delays caused by circumstances outside our reasonable
            control.
          </p>
        </LegalSection>

        <LegalSection title="Right to Cancel & Returns">
          <p>
            <strong>3.1 Consumers only:</strong> Under the Consumer Contracts
            (Information, Cancellation and Additional Charges) Regulations 2013,
            you have the right to cancel your order within 14 calendar days of
            receiving the Device, without giving a reason.
          </p>
          <p>
            <strong>3.2</strong> To exercise your right to cancel, contact us at{" "}
            <a href="mailto:support@energiebee.com">support@energiebee.com</a>{" "}
            with your order details.
          </p>
          <p>
            <strong>3.3</strong> Returned Devices must be:
          </p>
          <ul>
            <li>In their original, undamaged packaging</li>
            <li>Complete with all accessories and documentation</li>
            <li>Unused or, where used, returned in the condition received</li>
          </ul>
          <p>
            <strong>3.4</strong> We reserve the right to deduct an amount
            reflecting any diminishment in the value of the Device if it has
            been handled more than necessary.
          </p>
          <p>
            <strong>3.5</strong> Refunds will be processed within 14 days of
            receiving the returned Device, using the same payment method as your
            original purchase.
          </p>
          <p>
            <strong>3.6</strong> The right to cancel does not apply to digital
            content (such as App Subscriptions) once you have expressly
            consented to immediate access and acknowledged that the right to
            cancel is lost.
          </p>
        </LegalSection>

        <LegalSection title="Device & Hardware">
          <p>
            <strong>4.1</strong> The Device is designed to monitor and control
            your home&rsquo;s energy usage. Performance outcomes such as energy
            savings and indicative end will vary depending on your property,
            usage patterns, existing infrastructure, and energy tariff.
          </p>
          <p>
            <strong>4.2</strong> We do not guarantee specific energy savings or
            cost reductions. Any figures presented in our marketing materials
            are estimates based on typical usage scenarios.
          </p>
          <p>
            <strong>4.3</strong> Installation of the Device is your
            responsibility unless a professional installation service has been
            purchased from us or an authorised partner. You must ensure that
            installation complies with all applicable UK electrical regulations,
            including BS 7671 (IET Wiring Regulations). We recommend
            installation by a qualified electrician.
          </p>
          <p>
            <strong>4.4</strong> You must not:
          </p>
          <ul>
            <li>
              Attempt to modify, reverse engineer, disassemble, or tamper with
              the Device.
            </li>
            <li>
              Use the Device in a manner that is unsafe, unlawful, or not in
              accordance with our installation guide.
            </li>
            <li>Connect the Device to systems it is not designed for.</li>
          </ul>
          <p>
            <strong>4.5</strong> The Device must only be used with a compatible
            internet connection and power supply meeting the specifications set
            out in the product documentation.
          </p>
        </LegalSection>

        <LegalSection title="Mobile Application & Account">
          <p>
            <strong>5.1</strong> To access the full functionality of the App,
            you must create an Account. You are responsible for maintaining the
            confidentiality of your login credentials and for all activity that
            occurs under your Account.
          </p>
          <p>
            <strong>5.2</strong> You agree to notify us immediately at{" "}
            <a href="mailto:support@energiebee.com">support@energiebee.com</a>{" "}
            if you suspect any unauthorised access to your Account.
          </p>
          <p>
            <strong>5.3</strong> We reserve the right to suspend or terminate
            your Account if we reasonably believe you have breached these Terms,
            provided false information, or are engaged in fraudulent activity.
          </p>
          <p>
            <strong>5.4</strong> The App may be updated from time to time to
            improve functionality, security, or performance. You are responsible
            for keeping the App updated. We cannot guarantee that older versions
            of the App will remain functional.
          </p>
          <p>
            <strong>5.5</strong> We may offer premium features through paid
            Subscription plans. Subscription terms, pricing, and billing cycles
            will be clearly presented at the point of purchase. Subscriptions
            will auto-renew unless cancelled before the renewal date in
            accordance with Section 6.
          </p>
        </LegalSection>

        <LegalSection title="Intellectual Property">
          <p>
            <strong>6.1</strong> All intellectual property rights in the Device
            firmware, App, website, branding, content, and associated materials
            are owned by or licensed to EnergieBee Limited. Nothing in these
            Terms transfers any intellectual property rights to you.
          </p>
          <p>
            <strong>6.2</strong> We grant you a limited, non-exclusive,
            non-transferable, revocable licence to use the App solely for
            personal, non-commercial purposes in connection with your Device, in
            accordance with these Terms.
          </p>
          <p>
            <strong>6.3</strong> You must not copy, reproduce, distribute, or
            create derivative works of any of our intellectual property without
            our prior written consent.
          </p>
        </LegalSection>

        <LegalSection title="Energy Data & Privacy">
          <p>
            <strong>7.1</strong> The App collects and processes energy usage
            data from your Device to display metrics, provide insights, and
            improve our Services. By using the App, you consent to this data
            processing as described in our <a href="/privacy">Privacy Policy</a>
            .
          </p>
          <p>
            <strong>7.2</strong> Your energy data is associated with your
            Account and is not sold to third parties. We may use anonymised and
            aggregated data for product development and research purposes.
          </p>
          <p>
            <strong>7.3</strong> You retain ownership of your personal energy
            data. You may request deletion of your data at any time in
            accordance with rights granted by the UK General Data Protection
            Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
          <p>
            <strong>7.4</strong> We implement appropriate technical and
            organisational measures to protect your data. However, no method of
            transmission over the internet is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </LegalSection>

        <LegalSection title="Warranties & Product Guarantee">
          <p>
            <strong>8.1</strong> The Device is supplied with a 2-year
            manufacturer&rsquo;s warranty from the date of purchase, covering
            defects in materials and workmanship under normal use.
          </p>
          <p>
            <strong>8.2</strong> The warranty does not cover:
          </p>
          <ul>
            <li>
              Damage caused by accident, misuse, neglect, or unauthorised
              modification.
            </li>
            <li>
              Damage caused by improper installation or installation not in
              compliance with our guidelines.
            </li>
            <li>Normal wear and tear.</li>
            <li>
              Damage caused by power surges or incompatible electrical systems.
            </li>
          </ul>
          <p>
            <strong>8.3</strong> To make a warranty claim, contact us at{" "}
            <a href="mailto:support@energiebee.com">support@energiebee.com</a>{" "}
            with proof of purchase and a description of the defect. We may, at
            our discretion, repair, replace, or refund the Device.
          </p>
          <p>
            <strong>8.4</strong> Your statutory rights as a consumer under the
            Consumer Rights Act 2015 are not affected by this warranty. You are
            entitled to goods that are of satisfactory quality, fit for purpose,
            and as described.
          </p>
        </LegalSection>

        <LegalSection title="Limitation of Liability">
          <p>
            <strong>9.1</strong> To the fullest extent permitted by applicable
            law, EnergieBee shall not be liable for:
          </p>
          <ul>
            <li>
              Any indirect, consequential, incidental, or special loss or
              damage.
            </li>
            <li>
              Loss of energy savings, revenue, profit, or anticipated savings.
            </li>
            <li>Loss of data or corruption of data.</li>
            <li>Business interruption.</li>
            <li>
              Damage to property caused by improper installation or use of the
              Device.
            </li>
          </ul>
          <p>
            <strong>9.2</strong> Our total aggregate liability to you under or
            in connection with these Terms shall not exceed the amount paid by
            you for the Device and/or Services in the 12 months preceding the
            claim.
          </p>
          <p>
            <strong>9.3</strong> Nothing in these Terms limits or excludes our
            liability for:
          </p>
          <ul>
            <li>Death or personal injury caused by our negligence.</li>
            <li>Fraud or fraudulent misrepresentation.</li>
            <li>Any other liability that cannot be excluded by law.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Third-Party Services & Integrations">
          <p>
            <strong>10.1</strong> The App may integrate with third-party
            platforms (such as smart-home ecosystems, energy suppliers, or voice
            assistants). We do not control these third parties and are not
            responsible for the availability, accuracy, or conduct of any
            third-party services.
          </p>
          <p>
            <strong>10.2</strong> Your use of third-party services is subject to
            their own terms and conditions and privacy policies.
          </p>
          <p>
            <strong>10.3</strong> We do not endorse any third-party services and
            are not liable for any loss arising from your use of them in
            connection with our Services.
          </p>
        </LegalSection>

        <LegalSection title="Prohibited Use">
          <p>You agree not to use the Services to:</p>
          <ul>
            <li>Violate any applicable law or regulation.</li>
            <li>
              Attempt to gain unauthorised access to any system, network, or
              data.
            </li>
            <li>
              Transmit any harmful, offensive, fraudulent, or malicious content.
            </li>
            <li>Interfere with the proper functioning of the App or Device.</li>
            <li>Use automated scripts or bots to interact with the App.</li>
            <li>
              Resell or commercially exploit the Services without our prior
              written consent.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Service Availability">
          <p>
            <strong>11.1</strong> We aim to maintain a high level of App and
            platform availability, but do not guarantee uninterrupted access.
            The Services may be temporarily unavailable due to maintenance,
            updates, or circumstances beyond our control.
          </p>
          <p>
            <strong>11.2</strong> We reserve the right to modify, suspend, or
            discontinue any part of the Services at any time with reasonable
            notice where practicable.
          </p>
        </LegalSection>

        <LegalSection title="Changes to These Terms">
          <p>
            <strong>12.1</strong> We may update these Terms from time to time to
            reflect changes in our Services, applicable laws, or business
            practices.
          </p>
          <p>
            <strong>12.2</strong> We will notify you of material changes by
            email (to the address associated with your Account) or via a
            prominent notice within the App, at least 14 days before the changes
            take effect.
          </p>
          <p>
            <strong>12.3</strong> Your continued use of the Services after the
            effective date of any changes constitutes acceptance of the revised
            Terms. If you do not agree to the changes, you may terminate your
            Account and cease using the Services.
          </p>
        </LegalSection>

        <LegalSection title="Governing Law & Disputes">
          <p>
            <strong>13.1</strong> These Terms and any dispute relating to them
            or in connection with them (including non-contractual disputes)
            shall be governed by and construed in accordance with the laws of
            England and Wales.
          </p>
          <p>
            <strong>13.2</strong> The courts of England and Wales shall have
            exclusive jurisdiction to settle any dispute arising out of or in
            connection with these Terms.
          </p>
          <p>
            <strong>13.3 Alternative Dispute Resolution:</strong> We are
            committed to resolving disputes fairly. Before initiating legal
            proceedings, we encourage you to contact us directly at{" "}
            <a href="mailto:support@energiebee.com">support@energiebee.com</a>{" "}
            to seek an amicable resolution. If we are unable to resolve a
            dispute, you may also have the right to use the Online Dispute
            Resolution (ODR) platform provided by the European Commission at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
          <p className="mt-8 text-sm text-neutral-500">
            Last updated: May 2026
          </p>
        </LegalSection>
      </LegalContainer>
    </main>
  );
}
