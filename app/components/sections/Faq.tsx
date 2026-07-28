import JsonLd from "@/app/components/JsonLd";
import { faqPageSchema } from "@/app/lib/structured-data";
import type { FaqItem } from "@/app/lib/faq-data";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { FaqAccordion } from "./FaqAccordion";

/**
 * Visible FAQ section + matching FAQPage JSON-LD. The schema and heading are
 * server-rendered here; the interactive list is a HeroUI Accordion in the
 * client <FaqAccordion> island (still SSR'd, so the Q&A stays crawlable). The
 * visible Q&A and the schema come from the same `items`, keeping them in sync
 * as Google requires.
 */
export default function Faq({
  items,
  title = "Frequently asked questions",
}: {
  items: FaqItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <Section aria-labelledby="faq-heading" spacing="md" overflow="visible">
      <Container size="narrow">
        <JsonLd data={faqPageSchema(items)} />
        <h2
          id="faq-heading"
          className="text-2xl font-extrabold text-foreground sm:text-3xl"
        >
          {title}
        </h2>
        <FaqAccordion items={items} />
      </Container>
    </Section>
  );
}
