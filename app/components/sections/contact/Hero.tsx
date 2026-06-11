import { Heading, Text } from "@/app/components/ui/Typography";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Section } from "@/app/components/ui/Section";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import heroBgImg from "@/public/Cover/energiebee-contact-cover.png";

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

/**
 * Contact hero — dark band over the bee/hive cover, mirroring the marketing
 * page heroes (energy, heating, smart). Headline highlights "Help" in the
 * brand yellow; copy invites visitors to reach out.
 */
export default function Hero() {
  return (
    <Section
      spacing="none"
      surface="dark"
      className="isolate flex flex-col justify-center min-h-[50vh]"
    >
      {/* background photo + gradient */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={heroBgImg}
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
        <div className="relative z-10">
          <Breadcrumbs items={CRUMBS} tone="dark" className="mb-5" />
          <Heading as="h1" variant="display" className="">
            We&rsquo;re Here to <span className="text-[#EFDF18]">Help</span>
          </Heading>
          <Text variant="heroLead" className="mt-5 max-w-129.5">
            We&rsquo;re here to answer your questions and help you make the most
            of sustainable energy solutions.
          </Text>
        </div>
      </div>
    </Section>
  );
}
