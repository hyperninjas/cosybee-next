"use client";

import { Card, Chip, Input, Switch, TextArea, Tooltip } from "@heroui/react";
import { CircleCheckFill, CircleXmarkFill } from "@gravity-ui/icons";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { Labeled } from "./Labeled";

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** SEO & social card — Google SERP preview, SEO title/description override,
 *  social share image + alt, canonical URL, and the noindex switch. */
export function SeoCard({
  blog,
  title,
  description,
  effectiveSlug,
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  ogImage,
  setOgImage,
  ogImageAlt,
  setOgImageAlt,
  coverImageAlt,
  canonicalUrl,
  setCanonicalUrl,
  noindex,
  setNoindex,
  coverImage,
}: {
  blog: string;
  title: string;
  description: string;
  effectiveSlug: string;
  seoTitle: string;
  setSeoTitle: (v: string) => void;
  seoDescription: string;
  setSeoDescription: (v: string) => void;
  ogImage: string;
  setOgImage: (v: string) => void;
  ogImageAlt: string;
  setOgImageAlt: (v: string) => void;
  coverImageAlt: string;
  canonicalUrl: string;
  setCanonicalUrl: (v: string) => void;
  noindex: boolean;
  setNoindex: (v: boolean) => void;
  coverImage: string;
}) {
  const metaTitle = (seoTitle || title || "Untitled").trim();
  const metaDesc = (seoDescription || description).trim();

  // Lightweight on-page SEO heuristic — five equally weighted checks. Mirrors
  // Lighthouse's SEO audit signals (title, non-empty description, crawlable
  // URL, indexable) plus a social-card bonus. Each check carries a fix hint
  // surfaced in the score chip's tooltip. Not a substitute for a real audit.
  const hasShareImage =
    ogImage.trim().length > 0 &&
    (ogImageAlt || coverImageAlt).trim().length > 0;
  const checks = [
    {
      label: "Title set, 60 characters or fewer",
      passed: metaTitle.length > 0 && metaTitle.length <= 60,
      fix:
        metaTitle.length > 60
          ? `Title is ${metaTitle.length} characters — trim to 60 or fewer so search results don't truncate it.`
          : "Add a page title — it's the strongest on-page SEO signal.",
    },
    {
      label: "Meta description present",
      passed: metaDesc.length > 0,
      fix: "Add an SEO description (or article excerpt) so search engines can show a snippet.",
    },
    {
      label: "Crawlable URL slug",
      passed: effectiveSlug.trim().length > 0,
      fix: "Set a URL slug so the page has a stable, crawlable address.",
    },
    {
      label: "Indexable (not noindex)",
      passed: !noindex,
      fix: "“Hide from search engines” is on — turn it off to let this page be indexed.",
    },
    {
      label: "Social share image with alt text",
      passed: hasShareImage,
      fix: "Add a social share image and its alt text for richer link previews (recommended).",
    },
  ];
  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  // Gradient across the score: red → orange → amber → green as more checks pass.
  const scoreColor =
    score >= 80
      ? "success"
      : score >= 60
        ? "warning"
        : score >= 40
          ? "accent"
          : "danger";

  return (
    <Card>
      <Card.Header className="flex flex-row justify-between gap-2">
        <Card.Title className="text-sm font-semibold">
          SEO &amp; Search
        </Card.Title>
        <Tooltip delay={150}>
          <Tooltip.Trigger>
            <Chip
              size="sm"
              variant="soft"
              color={scoreColor}
              className="cursor-help px-2"
            >
              SEO checklist · {passedCount}/{checks.length}
            </Chip>
          </Tooltip.Trigger>
          <Tooltip.Content className="max-w-72 break-normal text-left">
            <p className="mb-1.5 font-semibold">
              SEO checklist · {passedCount}/{checks.length} passed
            </p>
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-1.5">
                  {c.passed ? (
                    <CircleCheckFill className="mt-px size-3.5 shrink-0 text-success" />
                  ) : (
                    <CircleXmarkFill className="mt-px size-3.5 shrink-0 text-danger" />
                  )}
                  <span>
                    {c.label}
                    {!c.passed && (
                      <span className="mt-0.5 block text-muted">{c.fix}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Tooltip.Content>
        </Tooltip>
      </Card.Header>
      <Card.Content className="space-y-3">
        {/* Google SERP preview — keeps Google's signature colours */}
        <div className="rounded-md border border-border p-2.5">
          <div className="text-xs text-[#1a6b2f]">
            energiebee.com › {blog} › {effectiveSlug || "…"}
          </div>
          <div className="leading-tight text-[#1a0dab]">
            {truncate(metaTitle, 60)}
          </div>
          <div className="mt-0.5 text-xs text-[#4d5156]">
            {truncate(metaDesc || "Add a description…", 150)}
          </div>
        </div>
        <Labeled label="SEO title" hint="Defaults to the title.">
          <Input
            variant="secondary"
            fullWidth
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={title || "Defaults to title"}
          />
        </Labeled>
        <Labeled label="SEO description" hint="Defaults to the excerpt.">
          <TextArea
            variant="secondary"
            fullWidth
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            placeholder={description || "Defaults to excerpt"}
          />
        </Labeled>
        <Labeled
          label="Social share image"
          hint="1200×630 image shown on social cards. Defaults to the cover image."
        >
          <PublicImageUpload
            context="blog-cover"
            library
            value={ogImage || coverImage || null}
            onChange={(url) => setOgImage(url ?? "")}
            alt={ogImageAlt || title}
          />
        </Labeled>
        <Labeled
          label="Share image alt text"
          hint="Defaults to the cover alt text."
        >
          <Input
            variant="secondary"
            fullWidth
            value={ogImageAlt}
            onChange={(e) => setOgImageAlt(e.target.value)}
            placeholder={coverImageAlt || "Defaults to cover alt"}
          />
        </Labeled>
        <Labeled
          label="Canonical URL"
          hint="Override the canonical link. Leave blank to derive from the slug."
        >
          <Input
            variant="secondary"
            fullWidth
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="https://energiebee.com/learn/about-us"
          />
        </Labeled>
        <div className="rounded-lg border border-border p-3 transition-colors hover:bg-background">
          <Switch
            isSelected={noindex}
            className="justify-between"
            onChange={setNoindex}
          >
            <Switch.Content>
              <span className="block text-sm font-medium text-foreground">
                Hide from search engines
              </span>
              <span className="block text-xs text-muted">
                Adds &lt;meta name=&quot;robots&quot;
                content=&quot;noindex&quot; /&gt;
              </span>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>
      </Card.Content>
    </Card>
  );
}
