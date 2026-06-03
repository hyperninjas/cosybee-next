import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  url,
} from "@/app/lib/site";
import { getAllArticles } from "@/app/lib/articles";
import type { Article } from "@/app/lib/article-types";

/**
 * Serves /llms.txt — a curated, LLM-friendly map of the site following the
 * llmstxt.org convention: an H1 title, a blockquote summary, then sections of
 * markdown links with short descriptions. Built from the same site constants
 * and live article data as the sitemap, so it stays in sync as posts publish.
 */

// Re-generate at most hourly; falls back gracefully if the blog API is down.
export const revalidate = 3600;

/** One markdown bullet per article: `- [title](url): description`. */
function articleLines(articles: Article[], basePath: string): string[] {
  return articles.map((a) => {
    const desc = a.description.replace(/\s+/g, " ").trim();
    return `- [${a.title}](${url(`${basePath}/${a.slug}`)})${desc ? `: ${desc}` : ""}`;
  });
}

export async function GET() {
  const [hive, learn] = await Promise.all([
    getAllArticles("hive").catch(() => [] as Article[]),
    getAllArticles("learn").catch(() => [] as Article[]),
  ]);

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} is a UK smart-home energy platform. One app connects every device in the home — solar forecasting, smart heating, whole-home energy monitoring, and AI-driven automated optimisation — to cut energy bills.`,
    "",
    "## Product",
    `- [Smart Home Integration](${url("/smart")}): Connect every device and let AI orchestrate energy automatically. Works with Alexa, Google Home, and Apple HomeKit.`,
    `- [Smart Heating Control](${url("/heating")}): Heating that learns your routines and adapts in real time — zone heating, geofencing, and AI boiler tuning.`,
    `- [Solar Forecasting & Optimisation](${url("/solar")}): 95% accurate next-day solar forecasting to schedule loads and maximise solar return.`,
    `- [Total Energy Control](${url("/energy")}): Track every watt across grid, solar, battery, and devices, with AI tariff shifting and bill forecasting.`,
    `- [Download the app](${url("/download")}): Get EnergieBee on iOS and Android.`,
    "",
    "## Company",
    `- [Contact](${url("/contact")}): Get in touch with the EnergieBee team.`,
    "",
    "## Blog",
    `- [The Hive](${url("/hive")}): Insights, stories, and expert advice on sustainable home energy.`,
    `- [Learn](${url("/learn")}): Guides, tutorials, and energy-saving tips.`,
  ];

  const hiveLines = articleLines(hive, "/hive");
  if (hiveLines.length) {
    lines.push("", "### The Hive — articles", ...hiveLines);
  }

  const learnLines = articleLines(learn, "/learn");
  if (learnLines.length) {
    lines.push("", "### Learn — articles", ...learnLines);
  }

  lines.push(
    "",
    "## Legal",
    `- [Privacy Policy](${url("/privacy")})`,
    `- [Terms & Conditions](${url("/terms")})`,
    `- [Cookie Policy](${url("/cookies")})`,
    `- [Data Security](${url("/data-security")})`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
