import { CtaCard } from "../ui/Cta";

/**
 * Standalone CTA section advertising broad solar-system compatibility.
 * Wraps a single CtaCard in page-edge padding so it can be dropped
 * between marketing sections.
 */
export default function WorksWithAnySystem() {
  return (
    <section className="mx-auto max-w-7xl lg:mt-16 pb-5">
      <CtaCard
        glyph="sun"
        glyphColor="#A3D055"
        title="Works With Any Solar System"
        description="Compatible with all major solar panel brands and inverters. Whether you have a small residential system or a larger commercial installation."
        buttonText="Get Started Today"
        href="/start"
      />
    </section>
  );
}
