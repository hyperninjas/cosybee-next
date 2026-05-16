import Image from "next/image";
import Link from "next/link";
import SocialCluster from "./SocialCluster";
import energiebeeLogo from "@/public/energiebee-vertical-logo.svg";

const WHY_LINKS = [
  { label: "£0 Monthly Fees (vs tado £2.99/mo)", href: "#" },
  { label: "Smart AI Optimisation", href: "#" },
  { label: "Works with Tado Hardware", href: "#" },
  { label: "Real-Time Savings Tracking", href: "#" },
];

const GET_STARTED_LINKS = [
  { label: "Download App (Free)", href: "#" },
  { label: "Heating Control", href: "#" },
  { label: "Save £300+ Annually", href: "#" },
  { label: "Contact Support", href: "#" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Data Security", href: "/data-security" },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-360 grid-cols-1 gap-12 px-6 pt-16 pb-12 sm:px-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-8 lg:px-30 lg:pt-20 lg:pb-14">
        {/* brand + tagline */}
        <div>
          <Image
            src={energiebeeLogo}
            alt="energiebee"
            className="h-auto w-36"
            priority
          />
          <p className="mt-5 max-w-70 text-[15px] leading-relaxed text-white">
            Smart home energy control that pays for itself. Save up to £300/year
            vs tado.
          </p>
        </div>

        {/* why energiebee */}
        <div>
          <h3 className="text-lg font-bold tracking-[0.08em]">
            WHY ENERGIEBEE
          </h3>
          <ul className="mt-5 space-y-4.5">
            {WHY_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[15px] font-medium text-neutral-300 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* get started */}
        <div>
          <h3 className="text-lg font-bold tracking-[0.08em]">GET STARTED</h3>
          <ul className="mt-5 space-y-4.5">
            {GET_STARTED_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[15px] font-medium text-neutral-300 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* social — hex hive cluster */}
        <div>
          <h3 className="text-lg font-bold tracking-[0.08em]">SOCIAL MEDIA</h3>
          <SocialCluster
            className="mt-5 h-auto pb-1 w-46"
            facebook="https://facebook.com"
            instagram="https://instagram.com"
            youtube="https://youtube.com"
            linkedin="https://linkedin.com"
          />
        </div>
      </div>

      {/* bottom strip */}
      <div className="border-t border-[#FFFFFF1A] ">
        <div className="mx-auto flex max-w-360 flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-30">
          <p className="text-sm font-medium text-white">
            © 2026 Energiebee. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
