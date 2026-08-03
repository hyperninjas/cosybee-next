import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Section } from "@/app/components/ui/Section";
import { Heading, Text } from "@/app/components/ui/Typography";
import HeroBackgroundVideo from "./HeroBackgroundVideo";
import HeroDownloadCta from "./HeroDownloadCta";
import heroBgImg from "@/public/energibee-hero-image.jpg";
import { HERO_VIDEO_LANDSCAPE } from "@/app/lib/hero-videos";

/**
 * Download page hero — like HomeHero, but the background is the landscape
 * product video layered over the photo (which paints first and serves as the
 * reduced-motion fallback), with the same gradient overlay and copy on the
 * left. The store CTA is device-aware (badge on phones, QR on desktop — see
 * HeroDownloadCta).
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
      </div>

      {/* Background video layered over the photo: the photo paints
          immediately; the video covers it once frames arrive (faststart-
          encoded, so playback begins while still downloading). Mounted only
          at md+ — phones keep the photo and never fetch the file. Sits
          outside the aria-hidden wrapper because it also renders clickable
          play/mute controls at the hero's top-right corner. */}
      <HeroBackgroundVideo src={HERO_VIDEO_LANDSCAPE} />

      {/* gradient overlay — after the video in the same -z-10 layer so it
          darkens video and photo alike, keeping the copy legible */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_15.16%,rgba(0,0,0,0.6)_48.87%,rgba(0,0,0,0)_120.19%)]"
      />

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
      </div>
    </Section>
  );
}
