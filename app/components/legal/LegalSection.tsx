import { type ReactNode } from "react";

/**
 * One numbered/named section of a legal page: H2 title with the body
 * underneath. The body styles common HTML descendants (p, ul/ol, strong,
 * a, h3) so a consumer can write plain JSX inside without remembering
 * Tailwind utilities.
 */
export default function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0 sm:mt-12">
      <h2 className="text-xl font-bold text-black sm:text-2xl">{title}</h2>
      <div
        className={[
          "mt-4 text-[15px] leading-relaxed text-neutral-700",
          "[&>*+*]:mt-3",
          "[&_p]:text-[15px] [&_p]:leading-relaxed",
          "[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-black",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2",
          "[&_strong]:font-semibold [&_strong]:text-black",
          "[&_a]:text-[#2563EB] [&_a]:underline [&_a]:underline-offset-2",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
