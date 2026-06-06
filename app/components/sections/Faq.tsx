import JsonLd from "@/app/components/JsonLd";
import { faqPageSchema } from "@/app/lib/structured-data";
import type { FaqItem } from "@/app/lib/faq-data";

/**
 * Visible FAQ section + matching FAQPage JSON-LD. Uses native <details>/<summary>
 * so it's accessible and needs zero client JS (no React Compiler concerns).
 * The visible Q&A and the schema are generated from the same `items`, keeping
 * them in sync as Google requires.
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
    <section
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20"
    >
      <JsonLd data={faqPageSchema(items)} />
      <h2
        id="faq-heading"
        className="text-2xl font-extrabold text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-8 divide-y divide-border border-t border-border">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              {item.question}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-45"
                aria-hidden
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
