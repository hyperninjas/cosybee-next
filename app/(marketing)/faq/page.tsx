import type { Metadata } from "next";
import { Section } from "@/app/components/ui/Section";
import { Container } from "@/app/components/ui/Container";
import { Heading, Text } from "@/app/components/ui/Typography";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import JsonLd from "@/app/components/JsonLd";
import { FaqAccordion } from "@/app/components/sections/FaqAccordion";
import { breadcrumbSchema, faqPageSchema } from "@/app/lib/structured-data";
import { pageMetadata } from "@/app/lib/seo";
import {
  ENERGY_FAQ,
  GENERAL_FAQ,
  HEATING_FAQ,
  SMART_FAQ,
  SOLAR_FAQ,
  type FaqItem,
} from "@/app/lib/faq-data";

export const metadata: Metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about EnergieBee — the app, energy monitoring, solar forecasting, smart heating, and the smart home hub.",
  ogDescription:
    "Everything you need to know about EnergieBee: the app, energy monitoring, solar, smart heating, and the smart home hub.",
  path: "/faq",
});

/**
 * Topic-grouped FAQ. Each group reuses the centralised FAQ datasets that also
 * power the per-page <Faq> sections, so the answers stay consistent across the
 * site. The visible questions and the single FAQPage JSON-LD are built from the
 * same `FAQ_GROUPS` (deduped), keeping schema and on-page content in sync as
 * Google requires.
 */
const FAQ_GROUPS: { title: string; items: FaqItem[] }[] = [
  { title: "About EnergieBee", items: GENERAL_FAQ },
  { title: "Energy monitoring", items: ENERGY_FAQ },
  { title: "Solar forecasting", items: SOLAR_FAQ },
  { title: "Smart heating", items: HEATING_FAQ },
  { title: "Smart home hub", items: SMART_FAQ },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" },
];

// One flat, de-duplicated list (by question) for the FAQPage schema — covers
// every question visible on the page without repeating any shared entries.
const ALL_FAQ = Array.from(
  new Map(
    FAQ_GROUPS.flatMap((g) => g.items).map((item) => [item.question, item]),
  ).values(),
);

export default function FaqPage() {
  return (
    <main className="flex-1">
      <JsonLd data={faqPageSchema(ALL_FAQ)} />
      <JsonLd data={breadcrumbSchema(CRUMBS)} />
      <Section spacing="md" surface="base">
        <Container size="page">
          <Breadcrumbs items={CRUMBS} className="mb-5" />
          <Heading as="h1" variant="title" className="text-foreground">
            Frequently asked questions
          </Heading>
          <Text variant="lead" tone="muted" className="mt-3 max-w-2xl">
            Everything you need to know about EnergieBee — from getting started
            to solar forecasting and smart heating. Can&rsquo;t find an answer?{" "}
            <a href="/contact" className="font-medium text-accent underline">
              Get in touch
            </a>
            .
          </Text>

          <div className="mt-12 flex flex-col gap-14">
            {FAQ_GROUPS.map((group) => (
              <section key={group.title} aria-labelledby={`faq-${group.title}`}>
                <h2
                  id={`faq-${group.title}`}
                  className="text-xl font-extrabold text-foreground sm:text-2xl"
                >
                  {group.title}
                </h2>
                <FaqAccordion items={group.items} />
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
