import { AppImage as Image } from "@/app/components/ui/AppImage";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import SocialCluster from "./SocialCluster";
import PhraseOfTheWeek from "./PhraseOfTheWeek";
import EnergieBeeLogo from "@/public/energiebee-vertical-logo.svg";
import { SOCIAL } from "@/app/lib/site";
import { phraseIndexForDate } from "@/app/lib/phrase-of-the-week";

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
  { label: "FAQs", href: "/faq" },
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
      <div className="mx-auto grid max-w-360 grid-cols-1 gap-12 px-6 pt-16 pb-12 sm:px-10 min-[1200px]:grid-cols-[1.5fr_3fr] lg:gap-8 lg:px-30 lg:pt-20 lg:pb-14">
        {/* brand + tagline */}
        <div>
          <Image
            src={EnergieBeeLogo}
            alt="EnergieBee"
            className="h-auto w-36"
            quality={85}
            loading="eager"
          />
          {/* <p className="mt-5 max-w-70 text-[15px] leading-relaxed text-white">
            Smart home energy control that pays for itself. Save up to £300/year
            vs tado.
          </p> */}
          {/* Phrase of the week — sits under the brand mark, in the column the
              tagline used to occupy: an editorial line belongs with the brand
              rather than among the link lists. Rotates weekly by ISO week
              number (see lib/phrase-of-the-week.ts). */}
          <div className="mt-8 max-w-90">
            <PhraseOfTheWeek initialIndex={phraseIndexForDate(new Date())} />
          </div>
        </div>
        <div className="mx-auto grid grid-cols-1 gap-12 w-full md:grid-cols-[1fr_1fr_1fr] text-balance lg:gap-8">
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
                    className="text-[15px] font-medium text-muted transition-colors hover:text-white"
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
                    className="text-[15px] font-medium text-muted transition-colors hover:text-white"
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
            <SocialCluster className="mt-5 h-auto pb-1 w-46" {...SOCIAL} />
          </div>
        </div>
      </div>

      {/* Phrase of the week — ALTERNATIVE placement: its own quiet band,
          sharing the legal strip's hairline and container so it reads as part
          of the footer's existing rhythm rather than as a banner. The wide,
          constrained measure suits the longer quotes (Kelvin's runs to 250
          characters, which is ~10 lines in the narrow brand column).

          NOTE: this renders a SECOND copy alongside the one in the brand
          column above — both will show the same phrase. Keep whichever
          placement wins and delete the other. */}
      <div className="border-t border-[#FFFFFF1A]">
        <div className="mx-auto max-w-360 px-6 py-8 sm:px-10 lg:px-30">
          <PhraseOfTheWeek initialIndex={phraseIndexForDate(new Date())} />
        </div>
      </div>

      {/* bottom strip */}
      <div className="border-t border-[#FFFFFF1A] ">
        <div className="mx-auto flex max-w-360 flex-col-reverse sm:flex-col sm:justify-center sm:items-center gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between md:px-10 lg:px-30">
          <p className="text-sm font-medium text-white md:mt-0 mt-2">
            © 2026 EnergieBee. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-4 md:gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-muted transition-colors hover:text-white"
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
