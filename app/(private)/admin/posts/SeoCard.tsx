"use client";

import { Card, Input, Switch, TextArea } from "@heroui/react";
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
}) {
  const metaTitle = (seoTitle || title || "Untitled").trim();
  const metaDesc = (seoDescription || description).trim();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm font-semibold">SEO &amp; Search</Card.Title>
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
            value={ogImage || null}
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
                Adds &lt;meta name=&quot;robots&quot; content=&quot;noindex&quot; /&gt;
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
