import { CtaCard } from "../ui/Cta";

/**
 * Standalone CTA section advertising broad solar-system compatibility.
 * Wraps a single CtaCard in page-edge padding so it can be dropped
 * between marketing sections.
 */
export default function WorksWithAnySystem() {
  return (
    <section className="mx-auto max-w-7xl pb-11 px-4 lg:px-0">
      <CtaCard
        title="Works With Any Solar System"
        description="Compatible with all major solar panel brands and inverters. Whether you have a small residential system or a larger commercial installation."
        buttonText="Get Started Today"
        href="/start"
      />
    </section>
  );
}
