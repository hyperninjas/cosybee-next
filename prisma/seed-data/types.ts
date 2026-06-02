// Legacy article shape — the structure the site used before content
// moved into SQLite. Kept only as the seed's input format; the seed
// converts these into `Post` rows (BlockNote JSON + rendered HTML).

/** A block inside a section: a paragraph string or a bullet list. */
export type LegacyBlock = string | { items: string[] };

export type LegacySection = {
  heading?: string;
  paragraphs?: string[];
  blocks?: LegacyBlock[];
};

export type LegacyBody = {
  lede?: string;
  sections: LegacySection[];
  cta?: { label: string; href?: string };
};

export type LegacyArticle = {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  seoTitle?: string;
  description: string;
  /** Public path (transformed from the old StaticImageData import). */
  image: string;
  imageAlt: string;
  author: { name: string; date: string };
  carouselIntro?: string;
  carouselBody?: string;
  body?: LegacyBody;
};
