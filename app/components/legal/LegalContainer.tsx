import { type ReactNode } from "react";

/** Narrow, centered column used to host LegalSection content beneath
 *  a LegalHero. Matches the column width of the hero so everything
 *  reads as one continuous document. */
export default function LegalContainer({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-6 pb-20 sm:px-10 lg:pb-28">
      {children}
    </article>
  );
}
