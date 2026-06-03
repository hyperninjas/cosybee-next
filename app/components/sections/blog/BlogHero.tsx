import Image from "next/image";
import Hexagon from "../../ui/Hexagon";
import heroBgImg from "@/public/hero-bg.png";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import sideImage from "@/public/bee-hive.png";
import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";

type Props = {
  title: string;
  description: string;
};

/**
 * Blog hero — background photo, decorative olive hex bleeding from the
 * left, and a 3-hex cluster on the right. Copy is passed in so each
 * blog (hive, learn, …) supplies its own title + description.
 */
export default function BlogHero({ title, description }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white flex flex-col justify-center min-h-[85vh]">
      {/* background photo + bottom-fade overlay */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={heroBgImg}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={80}
          placeholder="blur"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/30 to-black/0 h-[20%]" />
      </div>

      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-30 lg:pl-71.5 lg:pt-15 lg:pb-11">
        {/* decorative olive hexagon — bleeds in from the left edge */}
        <Hexagon
          color="#403A07"
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 w-104 -translate-y-1/2 sm:-left-36 sm:w-lg lg:-left-33 lg:w-[403.73px] h-[374.5px]"
        />

        {/* text */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[120%] tracking-tight xl:text-[2.5rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-lg text-neutral-300">
            {description}
          </p>
        </div>

        <SharedImageHexCluster
          src={sideImage.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#3a4a5c"
          className="w-full"
        />
      </div>
    </section>
  );
}
