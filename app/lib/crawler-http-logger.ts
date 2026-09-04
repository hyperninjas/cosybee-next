/**
 * The transport for crawler logging: a hook on the Node HTTP server that turns
 * every crawler request into one log line, complete with the response STATUS
 * and DURATION. Installed once at boot from `instrumentation.ts`.
 *
 * WHY HERE AND NOT IN proxy.ts
 * `proxy.ts` (Next 16's renamed middleware) is the obvious home for this and it
 * is where the crawler *detection* would go on Vercel — but it runs BEFORE the
 * route is rendered, so it can never see the status code or how long the
 * response took, which is half of what these logs are for. It would also mean
 * widening the proxy matcher from six auth paths to every request on the site,
 * putting the auth gate in the path of every asset fetch for the sake of a log
 * line. This app is deployed as a self-hosted `output: "standalone"` Node
 * server (see the Dockerfile), so we own the HTTP server and can observe the
 * request where the whole story is available. `proxy.ts` is left exactly as it
 * was.
 *
 * WHAT IT PATCHES
 * `http.Server.prototype.emit` — the same seam OpenTelemetry's HTTP
 * instrumentation uses. It is on the prototype rather than a server instance
 * because Next creates its HTTP server before `register()` runs, so there is no
 * instance to attach to. The handler only reads request/response metadata,
 * never touches the body, and always delegates to the original `emit`.
 */

import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

import {
  CRAWLER_LOG_ENABLED,
  TRUSTED_PROXY_HOPS,
  detectCrawler,
  logCrawlerHit,
  resolveClientIp,
  shouldLogPath,
} from "./crawler-log";

/**
 * Patching a prototype must happen exactly once per process. Dev recompiles
 * re-run `register()` with a fresh module instance, so the guard lives on
 * `globalThis`, which survives them, rather than in module scope, which does
 * not — otherwise every hot reload would add another layer and multiply the
 * log lines.
 */
type LoggerGlobal = typeof globalThis & { __ebCrawlerLoggerInstalled?: true };

/** First header value; Node gives arrays for headers that may repeat. */
function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function observeRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? "/";
  const queryStart = url.indexOf("?");
  const pathname = queryStart === -1 ? url : url.slice(0, queryStart);

  // Cheapest filter first: most requests are assets and never reach the
  // (much longer) User-Agent matching below.
  if (!shouldLogPath(pathname)) return;

  const userAgent = headerValue(req.headers["user-agent"]) ?? "";
  const crawler = detectCrawler(userAgent);
  if (!crawler) return; // A human's browser: nothing is logged, ever.

  // Stamped when the request arrived, not when it finished, so the timestamp
  // matches what the crawler saw.
  const timestamp = new Date().toISOString();
  const startedAt = process.hrtime.bigint();

  // "close" fires once per response, after "finish" for a completed one and
  // also when the client hangs up mid-response — in which case `status` is
  // whatever had been set, and the duration is time-until-disconnect.
  res.once("close", () => {
    logCrawlerHit({
      crawler,
      method: req.method ?? "GET",
      url,
      status: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1e5) / 10,
      ip: resolveClientIp(
        headerValue(req.headers["x-forwarded-for"]),
        headerValue(req.headers["x-real-ip"]),
        req.socket.remoteAddress,
      ),
      userAgent,
      referer: headerValue(req.headers.referer),
      timestamp,
    });
  });
}

/**
 * Install the hook. Safe to call repeatedly; only the first call does anything.
 */
export function installCrawlerLogger(): void {
  if (!CRAWLER_LOG_ENABLED) return; // CRAWLER_LOG=off: not even patched.

  const scope = globalThis as LoggerGlobal;
  if (scope.__ebCrawlerLoggerInstalled) return;
  scope.__ebCrawlerLoggerInstalled = true;

  const serverPrototype = http.Server.prototype;
  const originalEmit = serverPrototype.emit;

  serverPrototype.emit = function patchedEmit(
    this: http.Server,
    event: string | symbol,
    ...args: unknown[]
  ): boolean {
    if (event === "request") {
      // Never let a logging bug take down a request: swallow and carry on.
      try {
        observeRequest(args[0] as IncomingMessage, args[1] as ServerResponse);
      } catch {
        // Intentionally silent — a broken log line is not worth a 500.
      }
    }
    return originalEmit.apply(this, [event, ...args] as Parameters<
      typeof originalEmit
    >);
  } as typeof serverPrototype.emit;

  // One line at boot, so "no [CRAWLER] lines in the logs" can be told apart
  // from "the logger never attached".
  process.stdout.write(
    `[CRAWLER] logger attached (trustedProxyHops=${TRUSTED_PROXY_HOPS}, pid=${process.pid})\n`,
  );
}
