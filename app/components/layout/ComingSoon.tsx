import Link from "next/link";

/**
 * Reusable "Coming soon" placeholder for routes that exist in nav/footer
 * but aren't built yet. Branded to match the rest of the site so the user
 * lands on something intentional, not a 404.
 */
export default function ComingSoon({
  eyebrow = "Coming soon",
  title,
  description,
  cta = { label: "Back to home", href: "/" },
}: {
  eyebrow?: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <svg
        viewBox="0 0 57 40"
        width="56"
        height="40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="mb-6"
      >
        <path
          d="M56.39 18.67 52 11.06a2.4 2.4 0 0 0-2.3-1.32H40.9c-.4 0-.78.08-1.11.24a2.4 2.4 0 0 0-.33-1.04L35.07 1.33A2.4 2.4 0 0 0 32.77 0h-8.79a2.4 2.4 0 0 0-2.3 1.33L17.29 8.94a2.4 2.4 0 0 0-.33 1.04 2.4 2.4 0 0 0-1.12-.24H7.05a2.4 2.4 0 0 0-2.3 1.33L.35 18.67a2.4 2.4 0 0 0 0 2.66l4.4 7.61a2.4 2.4 0 0 0 2.3 1.32h8.79c.4 0 .78-.09 1.12-.25.05.37.16.72.33 1.04l4.39 7.61A2.4 2.4 0 0 0 23.98 40h8.79a2.4 2.4 0 0 0 2.3-1.33l4.4-7.61c.18-.32.3-.67.33-1.03.34.16.71.24 1.11.24h8.79a2.4 2.4 0 0 0 2.3-1.32l4.39-7.61a2.4 2.4 0 0 0 0-2.66Z"
          fill="#EFDF18"
        />
      </svg>
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
        {description}
      </p>
      <Link
        href={cta.href}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-accent px-8 py-3 text-base font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
      >
        {cta.label}
      </Link>
    </main>
  );
}
