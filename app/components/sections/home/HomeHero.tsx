import { AppImage as Image } from "@/app/components/ui/AppImage";
import { CtaButton } from "@/app/components/ui/Cta";
import { Section } from "@/app/components/ui/Section";
import { Heading, Text } from "@/app/components/ui/Typography";
import heroBgImg from "@/public/energibee-hero-image.jpg";
import heroDeviceImg from "@/public/energibee-hero-device.png";
import AppStoreButton from "@/app/components/ui/AppStoreButton";

/**
 * Home hero — "One app. Total energy clarity." Background photo of
 * a hand holding a phone, with two CTAs (free trial + App Store).
 */
export default function HomeHero() {
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
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          placeholder="blur"
          className="object-cover object-center"
        />
        {/* device mockup — pinned to the right edge of the 1440px content rail, fills section height */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-360 -translate-x-1/2">
          <Image
            src={heroDeviceImg}
            alt="energiebee app preview"
            aria-hidden
            priority
            fetchPriority="high"
            quality={90}
            placeholder="blur"
            className="absolute -right-10 bottom-0 h-full hidden min-[968px]:block portrait:hidden! w-auto z-9"
          />
        </div>
        <div className="absolute z-8 inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_15.16%,rgba(0,0,0,0.6)_48.87%,rgba(0,0,0,0)_120.19%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-360 items-center pt-16 pb-24 px-6 sm:px-6 lg:px-30 lg:pt-15 lg:pb-11">
        <div className="max-w-175">
          <Heading as="h1" variant="display">
            One app.
            <br />
            Total energy clarity.
          </Heading>
          <Text variant="heroLead" className="mt-5 max-w-129.5">
            <strong>EnergieBee</strong> shows how your home uses energy day by
            day. Understand heating, solar and energy balance in one place.
          </Text>
          <div className="mt-14 flex flex-wrap items-center gap-4">
            <CtaButton href="/try" size="md">
              Try it for free
            </CtaButton>
            <AppStoreButton />
          </div>
        </div>
      </div>
    </Section>
  );
}
