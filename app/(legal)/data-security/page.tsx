import LegalContainer from "@/app/components/legal/LegalContainer";
import LegalHero from "@/app/components/legal/LegalHero";
// import LegalIllustrationPlaceholder from "@/app/components/legal/LegalIllustrationPlaceholder";
import LegalSection from "@/app/components/legal/LegalSection";
import illustration from "@/public/illustration-cookies.svg";
import { AppImage as Image } from "@/app/components/ui/AppImage";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Security",
  description:
    "How EnergieBee protects your data — encryption, device security, cloud infrastructure, monitoring, and incident response.",
  alternates: { canonical: "/data-security" },
  robots: { index: true, follow: true },
  openGraph: {
    url: "/data-security",
    title: "Data Security — EnergieBee",
    description:
      "Encryption, device security, cloud infrastructure, monitoring, and incident response — how we keep your data safe.",
  },
};

export default function DataSecurityPage() {
  return (
    <main className="flex-1 bg-surface text-foreground">
      <LegalHero
        label="Data Security"
        title="Your Data Is Safe With Us"
        subtitle="We build security into everything we do, from the device in your home to the app on your phone."
        illustration={
          <Image src={illustration} alt="" className="max-h-110.75 w-auto" />
        }
      />

      <LegalContainer>
        <LegalSection title="Our Commitment to Security">
          <p>
            At EnergieBee, security is not an afterthought, it is built into
            every layer of how we design, develop, and operate our products.
            From the moment your EnergieBee Device connects to your home network
            to the instant energy data appears in your App, we apply rigorous
            measures to ensure your information remains private, protected, and
            under your control.
          </p>
          <p>
            We are committed to complying with the UK General Data Protection
            Regulation (UK GDPR), the Data Protection Act 2018, and recognised
            industry security standards. We continuously review and improve our
            security practices as technology and threats evolve.
          </p>
        </LegalSection>

        <LegalSection title="Data Encryption">
          <p>
            All data transmitted between your EnergieBee Device, the App, and
            our servers is protected using Transport Layer Security (TLS 1.2 or
            higher) — the same encryption standard used by banks and financial
            institutions. This ensures that your energy data cannot be
            intercepted or read by unauthorised parties while in transit.
          </p>
          <p>
            Data stored on our servers — including your account information,
            energy usage records, and device settings — is encrypted at rest
            using industry-standard AES-256 encryption. This means that even in
            the unlikely event of unauthorised access to our storage systems,
            your data would be unreadable without the correct decryption keys.
          </p>
          <p>
            Your account password is never stored in plain text. We use a
            one-way cryptographic hashing algorithm (bcrypt) so that your
            password cannot be recovered or read by anyone, including EnergieBee
            staff.
          </p>
        </LegalSection>

        <LegalSection title="Device & Network Security">
          <p>
            Your EnergieBee Device communicates with our platform over an
            encrypted channel. Each Device is assigned a unique,
            cryptographically secure identifier at the point of manufacture,
            ensuring that only your authorised Device can communicate with your
            account.
          </p>
          <p>We apply the following measures at the device level:</p>
          <p>
            <strong>Secure boot</strong> — The Device firmware is verified at
            startup to ensure it has not been tampered with or replaced with
            unauthorised software.
          </p>
          <p>
            <strong>Firmware signing</strong> — All software updates are
            digitally signed by EnergieBee before being delivered to your
            Device. Your Device will only accept updates that carry a valid
            EnergieBee signature, protecting against malicious software.
          </p>
          <p>
            <strong>Automatic security updates</strong> — When security patches
            are available, they are delivered automatically to your Device to
            keep it protected without requiring action from you.
          </p>
          <p>
            <strong>Isolated communication</strong> — Your Device only
            communicates with EnergieBee&rsquo;s verified cloud infrastructure.
            It does not make outbound connections to unknown or unverified
            servers.
          </p>
        </LegalSection>

        <LegalSection title="App Security">
          <p>
            The EnergieBee mobile application is designed with security at its
            core:
          </p>
          <p>
            <strong>Authentication</strong> — Access to your account requires
            your email address and a strong password. We enforce minimum
            password complexity requirements to reduce the risk of weak
            credentials.
          </p>
          <p>
            <strong>Session management</strong> — App sessions are time-limited
            and will require re-authentication after a period of inactivity,
            reducing the risk of unauthorised access if your device is lost or
            left unattended.
          </p>
          <p>
            <strong>Two-factor authentication (2FA)</strong> — We offer optional
            two-factor authentication for your EnergieBee account, adding an
            additional layer of protection beyond your password. We strongly
            recommend enabling this feature.
          </p>
          <p>
            <strong>Biometric login</strong> — On supported devices, you can use
            fingerprint or face recognition to access the App securely and
            conveniently.
          </p>
          <p>
            <strong>Certificate pinning</strong> — The App verifies the identity
            of our servers before transmitting any data, protecting against
            man-in-the-middle attacks even on untrusted networks.
          </p>
        </LegalSection>

        <LegalSection title="Cloud Infrastructure Security">
          <p>
            Your data is hosted on secure, enterprise-grade cloud
            infrastructure. Our hosting environment is provided by a reputable,
            ISO 27001-certified cloud provider operating data centres within the
            United Kingdom and European Economic Area (EEA).
          </p>
          <p>Key infrastructure security measures include:</p>
          <p>
            <strong>Access controls</strong> — Only authorised EnergieBee
            personnel with a legitimate business need can access production
            systems. Access is granted on a strictly need-to-know basis and is
            logged and audited.
          </p>
          <p>
            <strong>Multi-factor authentication</strong> — All internal system
            access by EnergieBee staff requires multi-factor authentication.
            Shared or generic credentials are not permitted.
          </p>
          <p>
            <strong>Network segmentation</strong> — Our systems are divided into
            isolated network zones so that a compromise of one area cannot
            easily spread to others.
          </p>
          <p>
            <strong>Firewall and intrusion detection</strong> — We deploy web
            application firewalls (WAF), network firewalls, and intrusion
            detection systems (IDS) to monitor and block malicious traffic.
          </p>
          <p>
            <strong>DDoS protection</strong> — Our infrastructure is protected
            against distributed denial-of-service attacks to maintain
            availability of the App and Website.
          </p>
        </LegalSection>

        <LegalSection title="Security Testing & Monitoring">
          <p>
            We do not rely on security measures alone — we actively test and
            monitor our systems to identify and address vulnerabilities before
            they can be exploited:
          </p>
          <p>
            <strong>Penetration testing</strong> — We engage independent
            security professionals to conduct penetration testing of our
            platform, App, and infrastructure on a regular basis.
          </p>
          <p>
            <strong>Vulnerability scanning</strong> — Automated scanning tools
            continuously check our systems for known vulnerabilities,
            misconfiguration, and outdated software components.
          </p>
          <p>
            <strong>Security monitoring</strong> — Our systems are monitored
            around the clock for anomalous activity, unauthorised access
            attempts, and potential threats. Alerts are investigated promptly by
            our security team.
          </p>
          <p>
            <strong>Dependency management</strong> — We regularly review and
            update the third-party software libraries used in our App and
            platform to ensure known security vulnerabilities are patched
            quickly.
          </p>
        </LegalSection>

        <LegalSection title="Employee & Internal Security">
          <p>
            We recognise that people are a critical part of any security
            strategy. All EnergieBee employees and contractors who handle
            personal data are required to:
          </p>
          <ul>
            <li>
              Complete data protection and security awareness training upon
              joining and on a regular basis thereafter;
            </li>
            <li>
              Adhere to our internal data handling, access control, and
              acceptable use policies;
            </li>
            <li>
              Report any suspected security incidents immediately to our
              security team;
            </li>
            <li>
              Sign confidentiality agreements as part of their employment or
              engagement terms.
            </li>
          </ul>
          <p>
            Access to personal data is restricted to those who genuinely need it
            to carry out their role. We regularly review access permissions and
            revoke them promptly when they are no longer required.
          </p>
        </LegalSection>

        <LegalSection title="Data Breach Response">
          <p>
            Despite our best efforts, no system can be guaranteed to be
            completely immune to security incidents. In the event of a data
            breach that poses a risk to your rights and freedoms, we are
            committed to acting swiftly and transparently:
          </p>
          <ul>
            <li>
              We will notify the Information Commissioner&rsquo;s Office (ICO)
              within 72 hours of becoming aware of a qualifying breach, in
              accordance with UK GDPR;
            </li>
            <li>
              We will notify you directly without undue delay if the breach is
              likely to result in a high risk to your personal rights and
              freedoms;
            </li>
            <li>
              Our notification to you will clearly describe the nature of the
              breach, the data involved, the likely consequences, and the steps
              we are taking to address it;
            </li>
            <li>
              We will take immediate remedial action to contain the breach,
              recover compromised data where possible, and prevent recurrence.
            </li>
          </ul>
          <p>
            If you suspect that your EnergieBee account has been compromised,
            please contact us immediately at{" "}
            <a href="mailto:security@EnergieBee.com">security@EnergieBee.com</a>
            .
          </p>
        </LegalSection>

        <LegalSection title="Your Role in Keeping Your Account Secure">
          <p>
            Security is a shared responsibility. There are steps you can take to
            help protect your EnergieBee account and data:
          </p>
          <ul>
            <li>
              Use a strong, unique password for your EnergieBee account — avoid
              reusing passwords from other services;
            </li>
            <li>
              Enable two-factor authentication (2FA) in the App settings for an
              extra layer of protection;
            </li>
            <li>
              Keep the EnergieBee App updated to ensure you always have the
              latest security improvements;
            </li>
            <li>
              Do not share your login credentials with anyone, including people
              you trust;
            </li>
            <li>Log out of the App when using a shared or public device;</li>
            <li>
              Contact us immediately at{" "}
              <a href="mailto:security@EnergieBee.com">
                security@EnergieBee.com
              </a>{" "}
              if you notice any suspicious activity on your account or receive
              unexpected communications claiming to be from EnergieBee.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Third-Party Security">
          <p>
            Where we share data with trusted third-party service providers (such
            as cloud hosting, payment processing, or analytics providers), we
            ensure they meet our security standards through:
          </p>
          <ul>
            <li>
              Contractual obligations requiring them to implement appropriate
              technical and organisational security measures;
            </li>
            <li>Data processing agreements (DPAs) compliant with UK GDPR;</li>
            <li>Due diligence assessments before onboarding new suppliers;</li>
            <li>Ongoing monitoring of supplier security practices.</li>
          </ul>
          <p>
            We only share the minimum amount of data necessary for third parties
            to perform their services on our behalf.
          </p>
        </LegalSection>

        <LegalSection title="Compliance & Certifications">
          <p>
            EnergieBee is committed to meeting recognised data security and
            privacy standards. Our security programme is aligned with:
          </p>
          <p>
            <strong>UK GDPR &amp; Data Protection Act 2018</strong> — We process
            personal data lawfully, transparently, and securely in accordance
            with UK data protection law.
          </p>
          <p>
            <strong>Cyber Essentials</strong> — We work towards alignment with
            the UK government-backed Cyber Essentials framework, which covers
            the fundamental security controls needed to protect against the most
            common cyber threats.
          </p>
          <p>
            <strong>OWASP Top 10</strong> — Our development practices are guided
            by the Open Web Application Security Project (OWASP) Top 10,
            addressing the most critical web application security risks.
          </p>
          <p className="mt-8 text-sm text-muted">
            This Data Security page was last reviewed and updated on 15 May
            2026. EnergieBee Limited is a company registered in England and
            Wales.
          </p>
        </LegalSection>
      </LegalContainer>
    </main>
  );
}
