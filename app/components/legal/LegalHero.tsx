import { type ReactNode } from "react";

/**
 * Top header for legal pages: small chip label, large title, subtitle,
 * and an optional illustration slot beneath. Centered content, narrow
 * column — matches the visual treatment from the Terms & Conditions
 * reference design.
 */
export default function LegalHero({
  label,
  title,
  subtitle,
  illustration,
}: {
  label: string;
  title: string;
  subtitle: string;
  illustration?: ReactNode;
}) {
  return (
    <header className="mx-auto max-w-3xl px-6 pt-12 pb-6 text-center sm:px-10 sm:pt-16 lg:pt-20">
      <span className="block text-base font-semibold tracking-wide text-[#EE3D1A] sm:text-lg">
        {label}
      </span>
      <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-black sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
        {subtitle}
      </p>
      {illustration && (
        <div className="mt-8 flex justify-center">{illustration}</div>
      )}
    </header>
  );
}
