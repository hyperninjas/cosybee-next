import type { StaticImageData } from "next/image";
import beeFlowerImg from "@/public/bee-flower.png";
import windTurbineImg from "@/public/wind-turbine.png";
import solarPanelImg from "@/public/solar-panal.png";

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type ArticleBody = {
  sections: ArticleSection[];
  /** Optional photo rendered after the last section, full-width. */
  inlineImage?: { src: StaticImageData; alt: string };
};

export type HiveArticle = {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  /** Short blurb shown on cards (latest grid + related). */
  description: string;
  image: StaticImageData;
  imageAlt: string;
  author: { name: string; date: string };
  /** Two-line hook shown in the featured carousel. */
  carouselIntro?: string;
  /** Slightly longer carousel body — only used when promoted. */
  carouselBody?: string;
  /** Full article body. Articles without `body` aren't routable. */
  body?: ArticleBody;
};

export const HIVE_ARTICLES: HiveArticle[] = [
  {
    slug: "a-warm-hive-a-cosy-home",
    category: "Nature Knows Best",
    readTime: "10 min read",
    title: "A Warm Hive, a Cosy Home",
    description:
      "There is something quietly reassuring about a beehive — and a lot to learn from it about how a home should feel.",
    image: beeFlowerImg,
    imageAlt: "A hand holding a smart thermostat displaying 74 degrees",
    author: { name: "Chris Glasser", date: "5 Apr 2026" },
    carouselIntro: "There is something quietly reassuring about a beehive.",
    carouselBody:
      "It is not perfect. It is not loud. It does not try to do everything at once. And yet, it works. Warmth builds slowly, through small movements and shared effort. Each bee does its part. Together, the hive stays liveable.",
    body: {
      sections: [
        {
          heading: "There is something quietly reassuring about a beehive.",
          paragraphs: [
            "It is not perfect. It is not loud. It does not try to do everything at once. And yet, it works. Warmth builds slowly, through small movements and shared effort. Each bee does its part. Together, the hive stays liveable.",
          ],
        },
        {
          heading: "Homes are not so different.",
          paragraphs: [
            "Most of us do not want complicated systems or constant decisions. We want to feel comfortable. We want to stay warm without worrying about every switch, every setting, every bill. We want a home that takes care of us a little, the way we try to take care of it.",
            "But modern homes often work against that idea. Heating comes on too strong or too late. Energy is used without much thought for timing, presence, or need. Comfort turns into something we chase instead of something that settles.",
          ],
        },
        {
          heading: "Nature shows another way.",
          paragraphs: [
            "In a hive, nothing is rushed. Adjustments happen all the time, quietly. When it gets colder, the hive responds. When conditions change, behaviour shifts. No excess. No drama. Just attention.",
          ],
        },
        {
          heading: "That same approach can exist at home.",
          paragraphs: [
            "A liveable home does not need more energy. It needs better timing. Warmth where it matters. Systems that notice when something has changed and respond without fuss. Comfort that feels steady rather than forced.",
            "We believe energy should feel more like a shared effort than a constant struggle. Smarter, gentler, and closer to the way natural systems already work.",
            "A warm, cosy hive is the result of care. A liveable, cosy home can be too.",
          ],
        },
      ],
      inlineImage: {
        src: solarPanelImg,
        alt: "Modern home at sunset with solar panels on the roof",
      },
    },
  },
  {
    slug: "from-waste-to-wisdom",
    category: "Nature Knows",
    readTime: "12 min read",
    title: "From Waste to Wisdom: Rethinking Energy at Home",
    description:
      "It is not perfect. It is not loud. It does not try to do everything at once. And yet, it works. Warmth builds slo…",
    image: windTurbineImg,
    imageAlt: "Wind turbines at sunset",
    author: { name: "Elliot Smith", date: "10 Apr 2026" },
  },
  {
    slug: "why-a-bee",
    category: "Innovation",
    readTime: "12 min read",
    title: "Why a Bee? A View on Work, Community and Energy",
    description:
      "I come from a region in England where people have long referred to one another as “bees”. It is more than a nick…",
    image: solarPanelImg,
    imageAlt: "Solar panels under a clear sky",
    author: { name: "Lila Del Ray", date: "10 Apr 2026" },
  },
  {
    slug: "home-heating-works",
    category: "Home & Living",
    readTime: "12 min read",
    title: "How Your Home Heating System Works",
    description:
      "In most homes, the heating system is part of the background....",
    image: beeFlowerImg,
    imageAlt: "Bees on a honeycomb",
    author: { name: "Mina Frost", date: "10 Apr 2026" },
  },
  {
    slug: "the-energy-of-spring",
    category: "Eco Living",
    readTime: "8 min read",
    title: "The Energy of Spring",
    description: "Longer days, a different kind of light, and a quieter grid.",
    image: windTurbineImg,
    imageAlt: "Wind turbines",
    author: { name: "Lila Del Ray", date: "12 Apr 2026" },
    carouselIntro: "Longer days, a different kind of light, and a quieter grid.",
    carouselBody:
      "When the sun returns, your home shifts character. Solar leads, batteries last longer, and the smart routines you set in winter no longer fit. Spring is the right moment to retune — small changes now compound across the whole bright half of the year.",
  },
  {
    slug: "small-changes-big-savings",
    category: "Home & Living",
    readTime: "6 min read",
    title: "Small Changes, Big Savings",
    description:
      "Most savings don't come from one big swap — they come from many small ones.",
    image: solarPanelImg,
    imageAlt: "Solar panels close-up",
    author: { name: "Mina Frost", date: "18 Apr 2026" },
    carouselIntro:
      "Most savings don't come from one big swap — they come from many small ones.",
    carouselBody:
      "A schedule tuned to your real day. A thermostat that listens. A water heater that runs when the sun does. None of these feel dramatic on their own, but stack them across a year and the bill reads differently.",
  },
];

export function getArticleBySlug(slug: string): HiveArticle | undefined {
  return HIVE_ARTICLES.find((a) => a.slug === slug);
}

/** Articles flagged for the home/featured carousel. */
export function getFeaturedArticles(): HiveArticle[] {
  return HIVE_ARTICLES.filter((a) => a.carouselIntro && a.carouselBody);
}

/** Latest grid (excludes the featured ones if you ever want to). */
export function getLatestArticles(limit = 3): HiveArticle[] {
  return HIVE_ARTICLES.slice(0, limit);
}

/** Related articles for the in-article footer (excludes the current one). */
export function getRelatedArticles(slug: string, limit = 2): HiveArticle[] {
  return HIVE_ARTICLES.filter((a) => a.slug !== slug).slice(0, limit);
}

/** Routable article slugs — used by generateStaticParams. */
export function getPublishedSlugs(): string[] {
  return HIVE_ARTICLES.filter((a) => a.body).map((a) => a.slug);
}
