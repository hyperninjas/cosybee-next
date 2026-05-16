import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has moved.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#EE3D1A]">
        404
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base text-neutral-600">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been
        moved. Try heading back to the homepage.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF8B27] to-[#EE3D1A] px-8 py-3 text-base font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
      >
        Back to home
      </Link>
    </main>
  );
}
