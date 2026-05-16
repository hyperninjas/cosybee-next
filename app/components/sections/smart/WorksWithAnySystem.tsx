import { CtaCard } from "../../ui/Cta";

/**
 * Standalone CTA section advertising broad smart-home compatibility.
 * Wraps a single CtaCard in page-edge padding so it can be dropped
 * between marketing sections.
 */
export default function WorksWithAnySystem() {
  return (
    <section className="mx-auto max-w-360 pb-11 pt-4 px-4 lg:px-30">
      <CtaCard
        title="Works With Any Smart Home System"
        description="Compatible with all major smart-home protocols — Matter, Zigbee, Z-Wave, and Wi-Fi. Plug-and-play setup in minutes."
        buttonText="Get Started Today"
        href="/start"
      />
    </section>
  );
}
