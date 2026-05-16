import Image from "next/image";
import { CtaButton } from "../../ui/Cta";
import heroBgImg from "@/public/hero-bg.png";
import AppStoreButton from "../../ui/AppStoreButton";

/**
 * Home hero — "One app. Total energy clarity." Background photo of
 * a hand holding a phone, with two CTAs (free trial + App Store).
 */
export default function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {/* background photo + gradient overlay */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroBgImg.src}')` }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-black/0" />
      </div>

      <div className="relative mx-auto max-w-360 px-6 pt-16 pb-24 sm:px-10 lg:px-30 lg:pt-20 lg:pb-28">
        <div className="max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[110%] tracking-tight sm:text-5xl lg:text-[56px]">
            One app.
            <br />
            Total energy clarity.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-300 sm:text-lg">
            Energiebee reveals how your household spends energy day by day —
            helping you reduce waste and improve efficiency. Create a home that
            feels lighter, smarter, and aligned with the way you live.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CtaButton href="/try" size="md">
              Try it for free
            </CtaButton>
            <AppStoreButton />
          </div>
        </div>
      </div>
    </section>
  );
}
