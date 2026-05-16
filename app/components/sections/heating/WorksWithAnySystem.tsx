import { CtaCard } from "../../ui/Cta";

/**
 * Standalone CTA section advertising broad solar-system compatibility.
 * Wraps a single CtaCard in page-edge padding so it can be dropped
 * between marketing sections.
 */
export default function WorksWithAnySystem() {
  return (
    <section className="mx-auto max-w-360 pb-11 pt-4 px-4 lg:px-30">
      <CtaCard
        title="Works With Any Heating System"
        description="Compatible with combi boilers, heat pumps, underfloor heating, and most smart thermostats. Setup takes minutes — no installer required."
        buttonText="Get Started Today"
        href="/start"
      />
    </section>
  );
}
