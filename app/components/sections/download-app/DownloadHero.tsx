import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Section } from "@/app/components/ui/Section";
import { Heading, Text } from "@/app/components/ui/Typography";
import VideoCarousel from "@/app/components/ui/VideoCarousel";
import HeroDownloadCta from "./HeroDownloadCta";
import heroBgImg from "@/public/energibee-hero-image.jpg";
import { HERO_VIDEO_LANDSCAPE } from "@/app/lib/hero-videos";

/**
 * Download page hero — same construction as HomeHero: background photo with
 * gradient overlay, copy on the left, and the shared product-video carousel
 * on the right (desktop only). Differences: the copy, and the store CTA is
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

      <div className="relative mx-auto flex w-full max-w-360 items-center justify-between gap-10 pt-16 pb-24 px-6 sm:px-6 lg:px-30 lg:pt-15 lg:pb-11">
        <div className="max-w-175">
          <Heading as="h1" variant="display" className="whitespace-pre-line">
            {"One app.\n Complete energy insight."}
          </Heading>
          <Text variant="heroLead" className="mt-5 max-w-129.5">
            See how you use energy, when your solar panels work best, and what
            to switch on and when.
          </Text>
          <div className="mt-14 flex flex-col flex-wrap w-fit gap-4">
            <HeroDownloadCta qrSvg={qrSvg} />
          </div>
        </div>

        {/* right: the single landscape product video — a one-video "carousel"
            renders as a plain inline looping video (no arrows/dots). Wider
            than HomeHero's portrait rail to suit 16:9; same desktop-only
            visibility rule. */}
        <div className="hidden w-full max-w-110 shrink-0 min-[968px]:block min-[1300px]:max-w-130">
          <VideoCarousel
            videos={[HERO_VIDEO_LANDSCAPE]}
            aspect="wide"
            className="shadow-2xl"
          />
        </div>
      </div>
    </Section>
  );
}
