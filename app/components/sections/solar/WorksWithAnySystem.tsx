import { CtaCard } from "../../ui/Cta";

export type WorksWithAnySystemProps = {
  title?: string;
  description?: string;
  buttonText?: string;
  href?: string;
};

/**
 * Standalone CTA section advertising broad solar-system compatibility.
 * Wraps a single CtaCard in page-edge padding so it can be dropped
 * between marketing sections. All copy is overridable so the same
 * section can be reused for other CTAs.
 */
export default function WorksWithAnySystem({
  title = "Works With Any Solar System",
  description = "Compatible with all major solar panel brands and inverters. Whether you have a small residential system or a larger commercial installation.",
  buttonText = "Get Started Today",
  href = "/start",
}: WorksWithAnySystemProps = {}) {
  return (
    <section className="mx-auto max-w-360 pb-11 pt-4 px-4 lg:px-30">
      <CtaCard
        title={title}
        description={description}
        buttonText={buttonText}
        href={href}
      />
    </section>
  );
}
