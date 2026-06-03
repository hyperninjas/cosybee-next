import Image from "next/image";
import { CtaButton } from "../../ui/Cta";
import heroBgImg from "@/public/energibee-hero-image.png";
import AppStoreButton from "../../ui/AppStoreButton";

/**
 * Home hero — "One app. Total energy clarity." Background photo of
 * a hand holding a phone, with two CTAs (free trial + App Store).
 */
export default function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white min-h-[85vh]">
      {/* background photo + gradient overlay */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={heroBgImg}
          alt="Hero image - dashboard of EnergieBee app"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={100}
          placeholder="blur"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(112.98deg,rgba(0,0,0,0.8)_5.9%,rgba(0,0,0,0)_76.63%)]" />
      </div>

      <div className="relative mx-auto max-w-360 px-6 sm:px-10 lg:px-30 py-48.5">
        <div className="max-w-175">
          <h1 className="text-4xl font-extrabold leading-[110%] tracking-tight sm:text-5xl lg:text-[75px]">
            One app.
            <br />
            Total energy clarity.
          </h1>
          <p className="mt-5 max-w-129.5 text-base sm:text-[22px] leading-7">
            <strong>EnergieBee</strong> shows how your home uses energy day by
            day. Understand heating, solar and energy balance in one place.
          </p>
          <div className="mt-14 flex flex-wrap items-center gap-4">
            <CtaButton href="/try" size="md" className="h-[58.66px]">
              Try it for free
            </CtaButton>
            <AppStoreButton />
          </div>
        </div>
      </div>
    </section>
  );
}
