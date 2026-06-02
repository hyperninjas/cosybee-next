import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma/client";
import { HIVE_ARTICLES } from "./seed-data/hive";
import { LEARN_ARTICLES } from "./seed-data/learn";
import type { LegacyArticle, LegacyBody } from "./seed-data/types";

process.loadEnvFile();

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
});

// --- Legacy body -> BlockNote document ------------------------------
// We rebuild each article as BlockNote blocks so the result is both
// editable in the admin editor and renderable by the server renderer.

type Inline =
  | { type: "text"; text: string; styles: Record<string, never> }
  | {
      type: "link";
      href: string;
      content: { type: "text"; text: string; styles: Record<string, never> }[];
    };

const URL_RE = /(https?:\/\/[^\s)]+)/g;

/** Split prose into text + link inline content, mirroring the old
 *  renderer's auto-linking (trailing punctuation stays out of href). */
function inlineFromText(text: string): Inline[] {
  const out: Inline[] = [];
  text.split(URL_RE).forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      const trail = part.match(/[.,;:!?]+$/)?.[0] ?? "";
      const href = trail ? part.slice(0, -trail.length) : part;
      out.push({
        type: "link",
        href,
        content: [{ type: "text", text: href, styles: {} }],
      });
      if (trail) out.push({ type: "text", text: trail, styles: {} });
    } else {
      out.push({ type: "text", text: part, styles: {} });
    }
  });
  return out.length ? out : [{ type: "text", text, styles: {} }];
}

function bodyToBlocks(body: LegacyBody) {
  const blocks: unknown[] = [];
  for (const section of body.sections) {
    if (section.heading) {
      blocks.push({
        type: "heading",
        props: { level: 2 },
        content: inlineFromText(section.heading),
      });
    }
    const items = section.blocks ?? section.paragraphs ?? [];
    for (const block of items) {
      if (typeof block === "string") {
        blocks.push({ type: "paragraph", content: inlineFromText(block) });
      } else {
        for (const li of block.items) {
          blocks.push({ type: "bulletListItem", content: inlineFromText(li) });
        }
      }
    }
  }
  return blocks;
}

async function seedArticle(blog: "hive" | "learn", a: LegacyArticle) {
  const blocks = bodyToBlocks(a.body ?? { sections: [] });
  const contentJson = JSON.stringify(blocks);
  // contentHtml is rendered lazily in the Next runtime (BlockNote's
  // server renderer can't load under tsx). Left empty here; the public
  // page renders from contentJson and caches the result.
  const featured = Boolean(a.carouselIntro && a.carouselBody);

  await prisma.post.upsert({
    where: { blog_slug: { blog, slug: a.slug } },
    update: {},
    create: {
      blog,
      slug: a.slug,
      title: a.title,
      seoTitle: a.seoTitle ?? null,
      description: a.description,
      category: a.category,
      tags: JSON.stringify([a.category]),
      readTime: a.readTime,
      coverImage: a.image,
      coverImageAlt: a.imageAlt,
      lede: a.body?.lede ?? null,
      ctaLabel: a.body?.cta?.label ?? null,
      ctaHref: a.body?.cta?.href ?? null,
      authorName: a.author.name,
      authorDate: a.author.date,
      carouselIntro: a.carouselIntro ?? null,
      carouselBody: a.carouselBody ?? null,
      featured,
      status: "PUBLISHED",
      contentJson,
      publishedAt: new Date(),
    },
  });
}

async function main() {
  // Deterministic seed: start from a clean slate so re-running mirrors
  // the fixtures exactly. (Use the admin panel for incremental edits.)
  await prisma.post.deleteMany();
  let count = 0;
  for (const a of HIVE_ARTICLES) {
    await seedArticle("hive", a);
    count++;
  }
  for (const a of LEARN_ARTICLES) {
    await seedArticle("learn", a);
    count++;
  }
  console.log(`Seeded ${count} posts (${HIVE_ARTICLES.length} hive, ${LEARN_ARTICLES.length} learn).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
