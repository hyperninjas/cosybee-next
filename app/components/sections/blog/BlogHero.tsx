import Image, { type StaticImageData } from "next/image";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/Section";
// import Hexagon from "@/app/components/ui/Hexagon";
// import SharedImageHexCluster from "@/app/components/ui/SharedImageHexCluster";
// import sideImage from "@/public/bee-hive.png";
// import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";

type Props = {
  title: string;
  description: string;
  bgImage: StaticImageData;
  /** Optional breadcrumb trail rendered above the title (dark-tone). */
  crumbs?: { name: string; path: string }[];
};

/**
 * Blog hero — background photo, decorative olive hex bleeding from the
 * left, and a 3-hex cluster on the right. Copy is passed in so each
 * blog (hive, learn, …) supplies its own title + description.
 */
export default function BlogHero({
  title,
  description,
  bgImage,
  crumbs,
}: Props) {
  return (
    <Section
      spacing="none"
      surface="dark"
      className="isolate flex flex-col justify-center min-h-[45vh] md:min-h-[55vh]"
    >
      {/* background photo */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          placeholder="blur"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/40 h-full" />
      </div>

      <div className="relative mx-auto w-full max-w-360 items-center pt-16 pb-24 px-6 lg:px-30 lg:pt-15 lg:pb-11">
        {/* decorative olive hexagon — bleeds in from the left edge */}
        {/* <Hexagon
          color="#403A07"
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 w-104 -translate-y-1/2 sm:-left-36 sm:w-lg lg:-left-33 lg:w-[403.73px] h-[374.5px]"
        /> */}

        {/* text */}
        <div className="relative z-10 ">
          {crumbs && crumbs.length > 0 && (
            <Breadcrumbs items={crumbs} tone="dark" className="mb-5" />
          )}
          <h1 className="text-4xl font-extrabold leading-[110%] tracking-tight sm:text-4xl md:text-5xl lg:text-[75px] ">
            {title}
          </h1>
          <p className="mt-5 max-w-129.5 text-base sm:text-[18px] md:text-[22px] leading-7">
            {description}
          </p>
        </div>

        {/* <SharedImageHexCluster
          src={sideImage.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#3a4a5c"
          className="w-full"
        /> */}
      </div>
    </Section>
  );
}
