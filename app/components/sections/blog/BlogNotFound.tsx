import NotFoundView, {
  DEFAULT_DESTINATIONS,
  type NotFoundDestination,
} from "@/app/components/sections/NotFoundView";

/** Card copy for each blog, used when it is offered from the *other* blog. */
const BLOGS: Record<string, NotFoundDestination> = {
  "/hive": {
    href: "/hive",
    title: "The Hive",
    description:
      "Catch up on the hive of activity: product updates, energy news and stories from other homes.",
  },
  "/learn": {
    href: "/learn",
    title: "Learn",
    description:
      "Plain-English guides to solar, heating and the numbers on your energy bill.",
  },
};

type Props = {
  /** Link target for the primary CTA, e.g. "/hive" or "/learn". */
  basePath: string;
  /** Primary CTA label, e.g. "Back to Hive". */
  backLabel: string;
};

/**
 * Shared 404 body for blog article subtrees. Renders the site-wide
 * {@link NotFoundView} with article-flavoured copy: the CTA returns to the
 * blog the reader was already in, and the third card offers the *other*
 * blog (there's no point suggesting the listing they're one click from).
 */
export default function BlogNotFound({ basePath, backLabel }: Props) {
  const siblingPath = basePath === "/learn" ? "/hive" : "/learn";
  const sibling = BLOGS[siblingPath];

  return (
    <NotFoundView
      status="Article not found"
      title="This one has flown the nest."
      lead="The article you were after has been retired, renamed or moved somewhere sunnier. The rest of the hive is still busy, though — here's what's worth a read."
      primary={{ href: basePath, label: backLabel }}
      destinations={[
        // The two product stories, then whichever blog they weren't reading.
        ...DEFAULT_DESTINATIONS.filter((d) => d.href !== "/hive"),
        sibling,
      ]}
      shortcutsLabel="Had something specific in mind?"
      shortcuts={[
        { href: "/search", label: "Search articles" },
        { href: "/", label: "Home" },
        { href: "/faq", label: "FAQs" },
        { href: "/contact", label: "Just ask us" },
      ]}
    />
  );
}
