import { type StaticImageData } from "next/image";
import PageHero from "@/app/components/ui/PageHero";

type Props = {
  title: string;
  description: string;
  bgImage: StaticImageData;
  /** Optional breadcrumb trail rendered above the title (dark-tone). */
  crumbs?: { name: string; path: string }[];
};

/**
 * Blog hero — dark band over a background photo. Copy is passed in so each
 * blog (hive, learn, …) supplies its own title + description.
 */
export default function BlogHero({
  title,
  description,
  bgImage,
  crumbs,
}: Props) {
  return (
    <PageHero bgImage={bgImage} crumbs={crumbs}>
      <h1 className="text-4xl font-extrabold leading-[110%] tracking-tight sm:text-4xl md:text-5xl lg:text-[75px] ">
        {title}
      </h1>
      <p className="mt-5 max-w-129.5 text-base sm:text-[18px] md:text-[22px] leading-7">
        {description}
      </p>
    </PageHero>
  );
}
