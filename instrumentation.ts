/**
 * Server bootstrap hook. Next calls `register()` once per server instance,
 * before the first request is handled.
 *
 * Today its only job is to install the crawler request logger — see
 * `app/lib/crawler-http-logger.ts` for why the logging lives at the HTTP layer
 * rather than in `proxy.ts`.
 */
export async function register(): Promise<void> {
  // The hook needs `node:http`, so it must not be pulled into an Edge bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { installCrawlerLogger } = await import("@/app/lib/crawler-http-logger");
  installCrawlerLogger();
}
