import { CtaButton } from "@/app/components/ui/Cta";
import { Heading, Text } from "@/app/components/ui/Typography";
import PageHero from "@/app/components/ui/PageHero";
import heroBgImg from "@/public/Cover/energiebee-solar-cover.png";

export default function Hero() {
  return (
    <PageHero bgImage={heroBgImg}>
      <Heading as="h1" variant="display">
        Solar Forecasting <span className="text-[#EFDF18]">95%</span>
        <br />
        <span className="text-[#EFDF18]">Accurate</span> Next Day
      </Heading>
      <Text variant="heroLead" className="mt-5 max-w-129.5">
        Advanced AI-powered solar production predictions. Plan your energy usage
        with confidence and maximise your solar investment with industry-leading
        accuracy.
      </Text>
      <CtaButton href="/get-started" size="md" className="mt-10">
        Get Started
      </CtaButton>
    </PageHero>
  );
}
