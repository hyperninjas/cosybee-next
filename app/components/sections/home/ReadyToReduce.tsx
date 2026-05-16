import Image from "next/image";
import { CtaButton } from "../../ui/Cta";
import deviceImg from "@/public/energy-saving-device.png";

/**
 * Final CTA — phone mockup on the left, headline + two download CTAs on
 * the right, all inside a white rounded card sitting on a dark page.
 */
export default function ReadyToReduce() {
  return (
    <section className="bg-black px-6 py-12 sm:px-10 lg:px-30 lg:py-16">
      <div className="mx-auto flex max-w-360 flex-col items-center gap-8 rounded-3xl bg-white p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] sm:p-10 lg:flex-row lg:gap-12 lg:p-14">
        {/* phone */}
        <div className="shrink-0">
          <Image
            src={deviceImg}
            alt="energiebee app preview"
            className="h-auto w-44 lg:w-52"
          />
        </div>

        {/* text + buttons */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-2xl font-extrabold leading-tight text-black sm:text-3xl lg:text-[32px]">
            Ready to reduce your energy costs?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#545454] sm:text-base">
            Download the free Energiebee app and start taking control today
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <CtaButton href="/download" size="md">
              Download Free App
            </CtaButton>
            <a
              href="https://apps.apple.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-900"
            >
              <span className="flex flex-col leading-tight">
                <span className="text-[10px]">Download on the</span>
                <span className="text-base font-semibold">App Store</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
