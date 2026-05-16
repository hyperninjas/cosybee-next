import Image from "next/image";
import AppStoreButton from "../../ui/AppStoreButton";
import { CtaButton } from "../../ui/Cta";
import deviceImg from "@/public/hero-device.svg";

/**
 * Final CTA — phone mockup on the left, headline + two download CTAs on
 * the right, all inside a white rounded card sitting on a dark page.
 */
export default function ReadyToReduce() {
  return (
    <section className="max-w-360 mx-auto px-6 py-12 sm:px-10 lg:px-30 lg:py-25">
      <div className="mx-auto relative flex max-w-360 flex-col items-center gap-8 rounded-3xl bg-[#F7F7F7] p-8 shadow-[0_30px_30px_-15px_rgba(0,0,0,0.15)] sm:p-10 lg:flex-row lg:gap-12 lg:p-14">
        {/* phone */}
        <div className="shrink-0 absolute bottom-0 hidden lg:block">
          <Image
            src={deviceImg}
            alt="energiebee app preview"
            sizes="(min-width: 1024px) 210px, 175px"
            quality={50}
            className="h-auto w-44 lg:w-52"
          />
        </div>
        <div className="h-auto w-44 lg:w-52"></div>
        {/* text + buttons */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-2xl font-extrabold leading-tight text-black sm:text-3xl lg:text-[40px]">
            Ready to reduce your energy costs?
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-[#545454] sm:text-lg">
            Download the free Energiebee app and start taking control today
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <CtaButton href="/download" size="md">
              Download Free App
            </CtaButton>
            <AppStoreButton color="#545454" />
          </div>
        </div>
      </div>
    </section>
  );
}
