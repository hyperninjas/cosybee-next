import Image from "next/image";
import { Section } from "@/app/components/ui/Section";
import { FeatureCard, SectionTitle } from "@/app/components/ui/SectionContent";
import VideoCarousel from "@/app/components/ui/VideoCarousel";
import deviceImg from "@/public/homepage-images/energiebee-solar-forecasting.png";

/**
 * Home "Solar Forecasting" — phone on the left, title + 3 feature cards
 * in the middle, portrait product video on the right.
 */
export default function HomeSolarForecasting() {
  return (
    <Section surface="secondary" spacing="lg" className="text-foreground">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12  lg:gap-10">
        {/* left: phone — wrapper has explicit width, image fills it via
            w-full h-auto so it scales proportionally instead of rendering
            at intrinsic size */}
        <div className="absolute -top-20 left-0 hidden w-[305.3px] min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="EnergieBee solar dashboard"
            sizes="(min-width: 1024px) 365px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + feature cards */}
        <div className="min-[1200px]:max-w-113.75 max-[1200px]:max-w-160 flex flex-col justify-center px-6 sm:px-10 lg:px-0">
          <SectionTitle align="left">Solar Forecasting</SectionTitle>
          {/* <p className="mt-3 max-w-xl text-base leading-relaxed max-[1200px]:text-center text-[#545454]">
            A complete view of solar production, weather, and usage across the
            day.
          </p> */}
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximise Production"
              description="See how your solar performs day by day."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="See how daily energy habits affect savings."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Insights"
              description="Understand patterns across your home energy."
            />
          </div>
          <div className="w-[335.3px] mx-auto min-[1200px]:hidden mt-4">
            <Image
              src={deviceImg}
              alt="EnergieBee solar dashboard"
              sizes="(min-width: 1024px) 365px, 280px"
              quality={85}
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* right: portrait product video — mirrors the left phone's width
            and top offset so the two sides read as a pair (9:16 at this
            width is ~543px tall vs the phone's ~578px). right-0 keeps it
            fully inside the rail — unlike the old hex cluster, nothing
            bleeds past the section edge. A one-video carousel renders as
            a plain looping video with hover play/mute controls. */}
        <div className="absolute -top-15 right-0 hidden w-[305.3px] min-[1200px]:block">
          <VideoCarousel
            videos={["/hero-videos/small_changes_(720p).mp4"]}
            className="shadow-2xl"
          />
        </div>
      </div>
    </Section>
  );
}
