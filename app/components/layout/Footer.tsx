import { AppImage as Image } from "@/app/components/ui/AppImage";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import SocialCluster from "./SocialCluster";
import PhraseOfTheWeek from "./PhraseOfTheWeek";
import EnergieBeeLogo from "@/public/energiebee-brand.svg";
import MaidInBritain from "@/public/MiB_Logo_Stacked_Colour-RGB.png";
import { SOCIAL } from "@/app/lib/site";
import { phraseIndexForDate } from "@/app/lib/phrase-of-the-week";
import { getLatestArticles, getPhrases } from "@/app/lib/articles";

/** Articles shown in the LATEST BLOGS column. */
const LATEST_COUNT = 4;

/**
 * Used only when the API returns nothing. The footer renders on every page,
 * so an empty column — a heading over blank space — would be a sitewide
 * regression the moment the backend hiccups. These posts are evergreen, so
 * the fallback is still a set of working links rather than a placeholder.
 */
const FALLBACK_LATEST_LINKS = [
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

export default async function Footer() {
  // Live from the blog rather than a hand-maintained list, so the column is
  // genuinely "latest" and publishing an article is the only step. Both reads
  // are tagged (CONTENT_TAG), so an admin save refreshes them sitewide.
  const [latest, phrases] = await Promise.all([
    getLatestArticles("hive", LATEST_COUNT),
    getPhrases(),
  ]);
  const latestLinks = latest.length
    ? latest.map((article) => ({
        label: article.title,
        href: `/${article.blog}/${article.slug}`,
      }))
    : FALLBACK_LATEST_LINKS;

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-360 grid-cols-1 gap-12 px-6 pt-16 pb-12 sm:px-10 min-[1200px]:grid-cols-[1.25fr_3fr] lg:gap-8 lg:px-30 lg:pt-20 lg:pb-14">
        {/* brand + tagline */}
        <div className="flex flex-col items-center gap-4">
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
              rather than among the link lists. The list and its order are
              curated at /admin/phrases; the entry shown rotates weekly by ISO
              week number (see lib/phrase-of-the-week.ts). */}
          <div className="px-4">
            <PhraseOfTheWeek
              phrases={phrases}
              initialIndex={phraseIndexForDate(new Date(), phrases.length)}
            />
          </div>
        </div>
        <div className="mx-auto grid grid-cols-1 gap-12 w-full md:grid-cols-[1.25fr_1.25fr_1fr] text-balance lg:gap-8">
          {/* why EnergieBee */}
          <div>
            <h3 className="text-[20px] leading-[100%] tracking-wider font-bold">
              LATEST BLOGS
            </h3>
            {/* text-balance on the <li>, not the <a>: text-wrap only applies
                to block containers, so on the inline link it would be a no-op.
                Keeps long labels from dropping a single orphan word. */}
            <ul className="mt-5 space-y-3">
              {latestLinks.map((link) => (
                // Keyed on href, not label: two posts can share a title, but
                // never a slug.
                <li key={link.href}>
                  {/* Article titles are author-written and unbounded, so they
                      are clamped to two lines to keep the column from growing
                      unpredictably. `line-clamp` sets `display: -webkit-box`,
                      so it works applied to the anchor itself. The full title
                      stays in the DOM for assistive tech, and `title` surfaces
                      it on hover for sighted users. */}
                  <Link
                    href={link.href}
                    title={link.label}
                    className="line-clamp-2 text-base font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* get started */}
          <div>
            <h3 className="text-[20px] leading-[100%] tracking-wider font-bold">
              GET STARTED
            </h3>
            <ul className="mt-5 space-y-3">
              {GET_STARTED_LINKS.map((link) => (
                <li key={link.label} className="text-balance">
                  <Link
                    href={link.href}
                    className="text-base font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* social — hex hive cluster */}
          <div className="w-fit md:justify-self-end">
            <h3 className="text-[20px] leading-[100%] tracking-wider font-bold">
              SOCIAL MEDIA
            </h3>
            <SocialCluster className="mt-5 h-auto pb-4 w-46" {...SOCIAL} />
            {/* `width`/`height` OVERRIDE the 3585x1200 intrinsic size of the
                import. Without them Next has no idea the logo renders at
                `w-50` (200px) and emits a single 2048px candidate — a 47KB
                decode for a 200px slot, on every page, eagerly. Given the real
                width it emits 256px 1x / 640px 2x instead (~14KB). Prefer this
                over a `sizes` string: a `sizes` carrying no `vw` unit makes
                Next fall back to offering the entire 15-rung ladder. */}
            <Image
              src={MaidInBritain}
              alt="EnergieBee"
              width={200}
              height={67}
              className="h-auto w-50 -ml-2"
              quality={85}
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div className="border-t border-[#FFFFFF1A] ">
        <div className="mx-auto flex max-w-360 flex-col-reverse sm:flex-col sm:justify-center sm:items-center gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between md:px-10 lg:px-30">
          <p className="text-sm font-medium text-white md:mt-0 mt-2 text-balance">
            © 2026 EnergieBee. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-4 md:gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label} className="min-w-22.5">
                <Link
                  href={link.href}
                  className="text-[13px] leading-[100%] font-medium text-white/80 transition-colors hover:text-white"
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
