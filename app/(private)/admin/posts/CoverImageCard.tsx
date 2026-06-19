"use client";

import { Card, Input } from "@heroui/react";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { Labeled } from "./Labeled";

/** Cover image upload + accessibility/credit metadata fields. */
export function CoverImageCard({
  title,
  coverUrl,
  setCoverUrl,
  coverImageAlt,
  setCoverImageAlt,
  coverImageTitle,
  setCoverImageTitle,
  coverImageCaption,
  setCoverImageCaption,
  coverImageCredit,
  setCoverImageCredit,
}: {
  title: string;
  coverUrl: string;
  setCoverUrl: (v: string) => void;
  coverImageAlt: string;
  setCoverImageAlt: (v: string) => void;
  coverImageTitle: string;
  setCoverImageTitle: (v: string) => void;
  coverImageCaption: string;
  setCoverImageCaption: (v: string) => void;
  coverImageCredit: string;
  setCoverImageCredit: (v: string) => void;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm font-semibold">Cover image</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-3">
        <PublicImageUpload
          context="blog-cover"
          library
          value={coverUrl || null}
          onChange={(url) => setCoverUrl(url ?? "")}
          onPickFromLibrary={(m) => {
            // Fill from the asset only when it has the value; keep typed text otherwise.
            if (m.alt) setCoverImageAlt(m.alt);
            if (m.title) setCoverImageTitle(m.title);
            if (m.caption) setCoverImageCaption(m.caption);
            if (m.credit) setCoverImageCredit(m.credit);
          }}
          alt={coverImageAlt || title}
        />
        <Labeled
          label="Alt text"
          hint="Describes the image for accessibility. Defaults to the title."
        >
          <Input
            variant="secondary"
            fullWidth
            value={coverImageAlt}
            onChange={(e) => setCoverImageAlt(e.target.value)}
            placeholder={title || "Enter alt text…"}
          />
        </Labeled>
        <Labeled label="Title" hint="Tooltip shown on hover. Optional.">
          <Input
            variant="secondary"
            fullWidth
            value={coverImageTitle}
            onChange={(e) => setCoverImageTitle(e.target.value)}
          />
        </Labeled>
        <Labeled
          label="Caption"
          hint="Short caption rendered beneath the hero. Optional."
        >
          <Input
            variant="secondary"
            fullWidth
            value={coverImageCaption}
            onChange={(e) => setCoverImageCaption(e.target.value)}
          />
        </Labeled>
        <Labeled
          label="Credit"
          hint='e.g. "© EnergieBee" or "Photo by Jane Doe". Optional.'
        >
          <Input
            variant="secondary"
            fullWidth
            value={coverImageCredit}
            onChange={(e) => setCoverImageCredit(e.target.value)}
          />
        </Labeled>
      </Card.Content>
    </Card>
  );
}
