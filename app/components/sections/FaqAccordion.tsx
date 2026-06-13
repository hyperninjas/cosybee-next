"use client";

import { Accordion } from "@heroui/react";
import type { FaqItem } from "@/app/lib/faq-data";

/**
 * Client island for the FAQ list, built on HeroUI's (react-aria) Accordion.
 * Kept separate from <Faq> so the FAQPage JSON-LD stays server-rendered; the
 * accordion is still SSR'd, so the questions/answers remain crawlable. Multiple
 * panels may be open at once, which reads better for a long FAQ.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion allowsMultipleExpanded className="mt-8">
      {items.map((item) => (
        <Accordion.Item key={item.question} id={item.question}>
          <Accordion.Heading>
            <Accordion.Trigger className="text-base font-semibold text-foreground">
              {item.question}
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="text-[15px] leading-relaxed text-muted">
              {item.answer}
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
