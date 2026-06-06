import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorProfile, getAuthorSlugs } from "@/app/lib/articles";
import { ArticleCard } from "@/app/components/sections/blog/BlogLatestArticles";
import Avatar from "@/app/components/ui/Avatar";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import JsonLd from "@/app/components/JsonLd";
import {
  breadcrumbSchema,
  personSchema,
  collectionPageSchema,
} from "@/app/lib/structured-data";
import { SITE_NAME } from "@/app/lib/site";

/** Prerender a page for every author that has published articles. */
export async function generateStaticParams() {
  const slugs = await getAuthorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getAuthorProfile(slug);
  if (!profile) return {};
  const { author } = profile;
  const description =
    author.bio ??
    `Articles by ${author.name}${author.role ? `, ${author.role}` : ""} on ${SITE_NAME}.`;
  return {
    title: author.name,
    description,
    alternates: { canonical: `/author/${slug}` },
    openGraph: {
      type: "profile",
      url: `/author/${slug}`,
      title: `${author.name} — ${SITE_NAME}`,
      description,
    },
  };
}

export default async function AuthorPage({
  params,
}: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const profile = await getAuthorProfile(slug);
  if (!profile) notFound();
  const { author, articles } = profile;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "The Hive", path: "/hive" },
    { name: author.name, path: `/author/${slug}` },
  ];

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          personSchema(author),
          breadcrumbSchema(crumbs),
          collectionPageSchema({
            name: `Articles by ${author.name}`,
            description: author.bio ?? `Articles by ${author.name} on ${SITE_NAME}.`,
            path: `/author/${slug}`,
            items: articles.map((a) => ({
              title: a.title,
              path: `/${a.blog}/${a.slug}`,
            })),
          }),
        ]}
      />

      <div className="mx-auto max-w-225 px-6 pt-10 pb-16 sm:px-5 lg:pt-16 lg:pb-24">
        <Breadcrumbs items={crumbs} className="mb-8" />

        {/* author header */}
        <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar
            name={author.name}
            avatarUrl={author.avatarUrl}
            className="h-20 w-20 text-2xl"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              {author.name}
            </h1>
            {author.role && (
              <p className="mt-1 text-sm font-semibold text-accent">
                {author.role}
              </p>
            )}
            {author.bio && (
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
                {author.bio}
              </p>
            )}
          </div>
        </header>

        {/* articles by this author */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground">
            {articles.length === 1
              ? "1 article"
              : `${articles.length} articles`}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {articles.map((a) => (
              <ArticleCard key={a.slug} a={a} basePath={`/${a.blog}`} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
