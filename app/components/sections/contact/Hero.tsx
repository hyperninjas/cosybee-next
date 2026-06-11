import { Heading, Text } from "@/app/components/ui/Typography";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Section } from "@/app/components/ui/Section";
import heroBgImg from "@/public/Cover/energiebee-hive-cover.png";

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
      className="isolate flex flex-col justify-center min-h-[45vh] md:min-h-[55vh]"
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

      <div className="relative mx-auto w-full max-w-360 pt-16 pb-20 px-6 lg:px-30 lg:pt-15 lg:pb-16">
        <div className="relative z-10">
          <Heading as="h1" variant="display">
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
