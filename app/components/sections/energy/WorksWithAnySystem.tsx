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
        title="Works With Any Energy Setup"
        description="Compatible with smart meters, inverters, batteries, and EV chargers from all major brands. Plug-and-play setup in minutes."
        buttonText="Get Started Today"
        href="/start"
      />
    </section>
  );
}
