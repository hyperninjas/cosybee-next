"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary. Catches errors thrown in the root layout
 * itself — meaning Navbar / Footer / fonts are not available, so this
 * file must render its own <html> and <body>.
 *
 * Triggered for catastrophic failures only. Most errors are caught by
 * the segment-level `error.tsx` above this.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "white",
          color: "#0a0a0a",
        }}
      >
        <div style={{ maxWidth: "560px", textAlign: "center" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#EE3D1A",
              margin: 0,
            }}
          >
            Critical error
          </p>
          <h1
            style={{
              marginTop: "12px",
              fontSize: "40px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "12px 0 0",
            }}
          >
            Something went seriously wrong
          </h1>
          <p
            style={{
              marginTop: "16px",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#525252",
            }}
          >
            We&rsquo;re having trouble loading the site. Please try refreshing
            in a moment — our team has been notified.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#737373",
              }}
            >
              Reference:{" "}
              <code style={{ fontFamily: "monospace" }}>{error.digest}</code>
            </p>
          )}

          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "32px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 32px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(to right, #FF8B27, #EE3D1A)",
              color: "white",
              fontSize: "16px",
              fontWeight: 500,
              boxShadow: "0 15px 30px -10px rgba(238,61,26,0.6)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
