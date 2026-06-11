import { CtaButton } from "@/app/components/ui/Cta";
import { Heading, Text } from "@/app/components/ui/Typography";
import PageHero from "@/app/components/ui/PageHero";
import heroBgImg from "@/public/Cover/energiebee-smart-cover.png";

export default function Hero() {
  return (
    <PageHero bgImage={heroBgImg} imageAlt="hero image of smart ">
      <Heading as="h1" variant="display" className="whitespace-pre-line">
        {"Works With \n Your "}
        <span className="text-[#EFDF18]">Smart Home</span>
      </Heading>
      <Text variant="heroLead" className="mt-5 max-w-145.5">
        Connect your solar system, battery and smart home devices to see
        everything in one place. AI-powered insights help you understand energy
        production, usage and savings — and make smarter decisions every day.
      </Text>
      <CtaButton href="/get-started" size="md" className="mt-10">
        Get Started
      </CtaButton>
    </PageHero>
  );
}
