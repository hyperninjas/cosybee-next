import Image from "next/image";
import Link from "next/link";
import SocialCluster from "./SocialCluster";
import EnergieBeeLogo from "@/public/energiebee-vertical-logo.svg";
import { SOCIAL } from "@/app/lib/site";

const WHY_LINKS = [
  { label: "A Warm Hive, a Cosy Home", href: "/hive/a-warm-hive-a-cosy-home" },
  {
    label: "Energy, Without the Noise",
    href: "/hive/energy-without-the-noise",
  },
  { label: "From Waste to Wisdom", href: "/hive/from-waste-to-wisdom" },
  {
    label: "The Big Picture: A Smarter UK",
    href: "/hive/the-big-picture-smarter-uk",
  },
];

const GET_STARTED_LINKS = [
  {
    label: "Should I Upgrade to a Heat Pump?",
    href: "/learn/should-i-upgrade-to-a-heat-pump",
  },
  {
    label: "Is Solar Right for My Home?",
    href: "/learn/is-solar-right-for-my-home",
  },
  { label: "About Us", href: "/learn/about-us" },
  { label: "Contact Support", href: "/contact" },
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
      <div className="mx-auto grid max-w-360 grid-cols-1 gap-12 px-6 pt-16 pb-12 sm:px-10 lg:grid-cols-[1.5fr_3fr] lg:gap-8 lg:px-30 lg:pt-20 lg:pb-14">
        {/* brand + tagline */}
        <div>
          <Image
            src={EnergieBeeLogo}
            alt="EnergieBee"
            className="h-auto w-36"
          />
          {/* <p className="mt-5 max-w-70 text-[15px] leading-relaxed text-white">
            Smart home energy control that pays for itself. Save up to £300/year
            vs tado.
          </p> */}
        </div>
        <div className="mx-auto grid grid-cols-1 gap-12 w-full md:grid-cols-[1.3fr_1fr_1fr] lg:gap-8">
          {/* why EnergieBee */}
          <div>
            <h3 className="text-lg font-bold tracking-[0.08em]">
              LATEST BLOGS
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
          <div className="w-fit md:justify-self-end">
            <h3 className="text-lg font-bold tracking-[0.08em]">
              SOCIAL MEDIA
            </h3>
            <SocialCluster
              className="mt-5 h-auto pb-1 w-46"
              {...SOCIAL}
            />
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div className="border-t border-[#FFFFFF1A] ">
        <div className="mx-auto flex max-w-360 flex-col-reverse sm:flex-col sm:justify-center sm:items-center gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between md:px-10 lg:px-30">
          <p className="text-sm font-medium text-white md:mt-0 mt-2">
            © 2026 EnergieBee. All rights reserved.
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
