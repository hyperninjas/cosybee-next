import { AppImage as Image } from "@/app/components/ui/AppImage";
import { CtaButton } from "@/app/components/ui/Cta";
import { Section } from "@/app/components/ui/Section";
import { Heading, Text } from "@/app/components/ui/Typography";
import HeroDownloadCta from "./HeroDownloadCta";
import heroBgImg from "@/public/energibee-hero-image.jpg";
// Placeholder — swap for the download-page device mockup when it's ready.
import heroDeviceImg from "@/public/download-app/Hand-Holding-iPhone-17-Pro-Free-psd-Mockup.png";

/**
 * Download page hero — same construction as HomeHero: background photo of a
 * hand holding a phone, device mockup pinned to the right edge of the 1440px
 * content rail, gradient overlay, copy on the left. Differences: the copy,
 * "Learn more" smooth-scrolls to #benefits, and the store CTA is
 * device-aware (badge on phones, QR on desktop — see HeroDownloadCta).
 */
export default function DownloadHero({ qrSvg }: { qrSvg: string }) {
  return (
    <Section
      spacing="none"
      surface="dark"
      className="isolate flex flex-col justify-center min-h-[75vh] md:min-h-[93vh]"
    >
      {/* background photo + gradient overlay */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={heroBgImg}
          alt="Hero image - dashboard of EnergieBee app"
          fill
          // `priority` is deprecated in Next 16 — `preload` is its successor.
          preload
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          placeholder="blur"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_15.16%,rgba(0,0,0,0.6)_48.87%,rgba(0,0,0,0)_120.19%)]" />
      </div>

      {/* device mockup — pinned to the right edge of the 1440px content rail.
          In its own -z-10 layer (the bg photo + gradient live at -z-20) so the
          overlay never darkens it, while the copy still renders above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-full max-w-360 -translate-x-1/2"
      >
        <Image
          src={heroDeviceImg}
          alt="EnergieBee app preview"
          aria-hidden
          preload
          quality={90}
          placeholder="blur"
          // Hidden below 968px; above it the mockup renders at most ~800px
          // wide (h-full of the hero, w-auto). Without `sizes` Next ships the
          // full-size source. Cap the srcset to the real display width. Not
          // the LCP element (the bg photo is), so no fetchPriority — let the
          // LCP image win the bandwidth race.
          sizes="(min-width: 968px) 800px, 1px"
          className="absolute -right-10 bottom-0 h-[90%] hidden min-[968px]:block portrait:hidden! w-auto"
        />
      </div>

      <div className="relative mx-auto w-full max-w-360 items-center pt-16 pb-24 px-6 sm:px-6 lg:px-30 lg:pt-15 lg:pb-11">
        <div className="max-w-175">
          <Heading as="h1" variant="display">
            Easily track energy usage with the user&#8209;friendly EnergieBee
            app.
          </Heading>
          <Text variant="heroLead" className="mt-5 max-w-129.5">
            Save energy, cut costs, and keep track of everything.
          </Text>
          <div className="mt-14 flex flex-col flex-wrap w-fit gap-4">
            <CtaButton href="#benefits" size="md">
              Learn more
            </CtaButton>
            <HeroDownloadCta qrSvg={qrSvg} />
          </div>
        </div>
      </div>
    </Section>
  );
}
