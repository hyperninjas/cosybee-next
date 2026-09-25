# News sitemap

`https://energiebee.com/news-sitemap.xml` — a [Google News sitemap][spec], read by
Googlebot-News to pick up articles within minutes of publication instead of
waiting for the next ordinary crawl.

It is **additional** to `/sitemap.xml`, never a replacement. The ordinary sitemap
stays the permanent record of every URL on the site; this file is a rolling
window of what is new.

[spec]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap

## What goes in it

An article is listed when **all** of these hold:

| Rule | Where it lives |
| --- | --- |
| It's in **The Hive** — `learn` is evergreen guides, which Google asks publishers to keep out | `NEWS_BLOG` / `isNewsArticle`, `app/lib/news-sitemap.ts` |
| Published in the **last 2 days** | `NEWS_WINDOW_DAYS`, same file |
| Not `noindex`, and not pointing its canonical at another site | `isAdvertisable`, `app/lib/articles.ts` — the same predicate `/sitemap.xml` uses |
| It has a headline and a publication date | `buildNewsSitemap`, same file |

Each entry carries exactly the four fields Google requires — `news:name`,
`news:language`, `news:publication_date`, `news:title` — in the order the
published schema demands. No optional fields (`news:genres`, `news:keywords`,
`news:stock_tickers`) are emitted; add them to `urlXml` if a reason ever appears.

## When nothing is new, it lists one plain URL

Google's rule is that a news sitemap holds articles "created in the last two
days". On a site that publishes weekly, the window is **empty most days**.

The file is never empty, though. **An empty `<urlset>` is schema-invalid**: the
sitemaps.org schema declares `<url>` with no `minOccurs`, so at least one is
required. Search Console reports it as an error — *"Sitemap can be read, but has
errors · Missing XML tag · Parent tag: urlset, Tag: url"* — rather than as a
sitemap with nothing in it. (That is how this was found: the first version shipped
an empty `<urlset>` on the assumption it was fine. It was well-formed XML, which
is not the same thing.)

So when the window is empty, the newest news article is listed as a plain
`<url>` carrying only its `<loc>` — no `<news:news>` block. That is the form
Google's own guidance sanctions for an aged-out article: *"remove those URLs from
the news sitemap or remove the `<news:news>` metadata"*. With no news block it
makes no claim to be news, so it cannot be flagged as too old; it reads as an
ordinary sitemap entry for a URL `/sitemap.xml` already lists.

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://energiebee.com/hive/newest-article</loc>
  </url>
</urlset>
```

The only time the set is genuinely empty is a catalogue with **no hive articles
at all**, when there is nothing to put in it. A backend failure does not produce
that state — the read throws and the route 500s instead.

**Do not widen `NEWS_WINDOW_DAYS` to make the file look busier.** Stale entries
*with* news metadata are what the spec asks publishers to remove, and they buy
nothing: Googlebot-News ignores an out-of-window article wherever it finds it.

The route reports which state it is in, so you don't have to read the body:

```bash
curl -sI https://energiebee.com/news-sitemap.xml | grep -iE "x-news"
```

| `X-News-Article-Count` | `X-News-Placeholder` | Meaning |
| --- | --- | --- |
| `≥1` | `0` | Articles in the window, listed with news metadata |
| `0` | `1` | Nothing new in two days — newest article listed plainly (normal) |
| `0` | `0` | No hive articles exist at all |

### Validating it properly

Check a change against **both** schemas at once. The core sitemap schema admits
`news:news` through a *strict* wildcard, so validating against it alone fails on
every populated file for want of the news schema — and validating the news
fragments alone never looks at the `<urlset>` around them, which is exactly how
the empty-set bug got through. A driver schema that imports both:

```xml
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <xsd:import namespace="http://www.sitemaps.org/schemas/sitemap/0.9"
              schemaLocation="https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"/>
  <xsd:import namespace="http://www.google.com/schemas/sitemap-news/0.9"
              schemaLocation="https://www.google.com/schemas/sitemap-news/0.9/sitemap-news.xsd"/>
</xsd:schema>
```

```bash
curl -s https://energiebee.com/news-sitemap.xml -o news.xml
xmllint --noout --schema driver.xsd news.xml
```

Run it on a day with nothing new as well as a day with fresh articles — the
empty-window case is the one that broke.

## How it stays fresh

This file goes stale on the **clock** as well as on content — an article leaves
the window with nothing having been edited. So the route calls `connection()`,
which renders it at request time; without that, Next would prerender it at build
and freeze the window against a stopped clock. (It does prerender `/sitemap.xml`
that way, which is fine there — that file has no time dimension.)

`connection()` rather than `force-dynamic`: the latter would also force every
fetch to `no-store`, discarding the article read's shared Data Cache entry and
re-walking the catalogue on each crawler hit. This way only the render moves to
request time; the read keeps its 60s TTL and its `CONTENT_TAG`.

Publishing from the admin calls `revalidateContent()`, which expires the tag
outright and re-renders `/news-sitemap.xml` along with the other derived files,
so a new article appears on the very next request. There is no separate step.

## Where the pieces are

| File | Role |
| --- | --- |
| `app/lib/news-sitemap.ts` | The document builder: all the rules, plus the XML. Pure function of articles + a clock. |
| `app/(blog)/news-sitemap.xml/route.ts` | The route. Fetches, builds, sets the cache and count headers. |
| `app/lib/articles.ts` | `getIndexableArticles(blog)` — the published, advertisable catalogue. |
| `app/lib/xml.ts` | `escapeXml` / `w3cDate`, shared with the RSS feeds and the video sitemap. |
| `app/robots.ts` | Advertises the file alongside `/sitemap.xml` and `/video-sitemap.xml`. |
| `app/lib/revalidate.ts` | Re-renders it when an admin publishes. |
| `app/lib/crawler-log.ts` | Logs every crawler hit on it (`ALWAYS_LOG`). |

## Submitting it

Once deployed to production:

1. Open [Google Search Console](https://search.google.com/search-console) and
   select the EnergieBee property.
2. **Indexing → Sitemaps**.
3. Enter `news-sitemap.xml` and submit.

It only needs submitting once — Google re-reads it on its own schedule
thereafter, and robots.txt advertises it regardless.

Worth knowing: a news sitemap speeds up *discovery*; it is not an application to
Google News. Sites are considered for Google News automatically, so there is no
separate submission to make.

## Validating a deploy

```bash
# 200, XML content type, and how many articles are listed
curl -sI https://energiebee.com/news-sitemap.xml

# Parses cleanly (well-formed only — see "Validating it properly" for the schema check)
curl -s https://energiebee.com/news-sitemap.xml | xmllint --noout - && echo OK

# Listed URLs actually resolve
curl -s https://energiebee.com/news-sitemap.xml \
  | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' \
  | while read -r u; do echo "$(curl -so /dev/null -w '%{http_code}' "$u") $u"; done
```

Then check the titles match the articles' own `<h1>` and the dates match their
publication dates — both come straight from the post record, so a mismatch means
the record is wrong rather than the sitemap.

Ongoing, watch Search Console's Sitemaps report for read errors, and the crawler
log (see [crawler-logging.md](crawler-logging.md)) for whether Googlebot-News is
actually turning up.
