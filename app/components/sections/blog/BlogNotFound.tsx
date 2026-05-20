import Link from "next/link";

type Props = {
  /** Link target for the back button, e.g. "/hive" or "/learn". */
  basePath: string;
  /** Back-button label, e.g. "Back to Hive". */
  backLabel: string;
};

/**
 * Shared 404 body for blog article subtrees. Each route supplies its
 * own basePath + label so the back button returns to the right blog.
 */
export default function BlogNotFound({ basePath, backLabel }: Props) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#EE3D1A]">
        404
      </p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
        Article not found
      </h1>
      <p className="mt-4 max-w-md text-base text-neutral-600">
        The article you&rsquo;re looking for doesn&rsquo;t exist or has been
        moved. Try heading back to the blog.
      </p>
      <Link
        href={basePath}
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-linear-to-r from-[#FF8B27] to-[#EE3D1A] px-8 py-3 text-base font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
      >
        {backLabel}
      </Link>
    </main>
  );
}
