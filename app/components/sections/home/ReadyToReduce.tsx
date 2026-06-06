import Image from "next/image";
import AppStoreButton from "../../ui/AppStoreButton";
import { CtaButton } from "../../ui/Cta";
import deviceImg from "@/public/homepage-images/energiebee-device-energy-download-app.png";

/**
 * Final CTA — phone mockup on the left, headline + two download CTAs on
 * the right, all inside a white rounded card sitting on a dark page.
 */
export default function ReadyToReduce() {
  return (
    <section className="max-w-360 mx-auto px-6 py-12 sm:px-10 lg:px-30 lg:py-25">
      <div className="mx-auto relative flex max-w-360 flex-col items-center gap-8 rounded-3xl bg-background p-8 shadow-[0_30px_30px_-15px_rgba(0,0,0,0.15)] sm:p-10 lg:flex-row lg:gap-12 lg:p-14">
        {/* phone */}
        <div className="shrink-0 absolute bottom-0 hidden min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="EnergieBee app preview"
            sizes="(min-width: 1024px) 210px, 175px"
            quality={85}
            className="h-auto w-44 lg:w-59"
          />
        </div>
        <div className="h-auto hidden min-[1200px]:block w-44 lg:w-59"></div>
        {/* text + buttons */}
        <div className="flex-1 text-center min-[1200px]:text-left">
          <p className="mt-1.5 text-base leading-relaxed text-muted sm:text-lg">
            EnergieBee helps you understand your home energy in a simple and
            connected way. One system. One view. Total clarity.
          </p>{" "}
          <h2 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl min-[1200px]:text-[40px]">
            Bring clarity to your home energy.
          </h2>
          <p className="mt-1.5 text-base leading-relaxed text-muted sm:text-lg">
            More time for what matters.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 min-[1200px]:justify-start">
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
