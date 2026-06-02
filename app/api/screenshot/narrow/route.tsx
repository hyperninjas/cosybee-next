import { ImageResponse } from "next/og";

export const dynamic = "force-static";

/**
 * 640×1136 PNG screenshot used by the PWA manifest's mobile (non-wide)
 * `form_factor` slot. Surfaces the richer mobile install UI in Chrome Android.
 */
export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 40px",
        background:
          "linear-gradient(180deg, #0a0a0a 0%, #1a1a0a 60%, #2a2410 100%)",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* brand mark */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg
          viewBox="0 0 57 40"
          width="40"
          height="28"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M56.39 18.67 52 11.06a2.4 2.4 0 0 0-2.3-1.32H40.9c-.4 0-.78.08-1.11.24a2.4 2.4 0 0 0-.33-1.04L35.07 1.33A2.4 2.4 0 0 0 32.77 0h-8.79a2.4 2.4 0 0 0-2.3 1.33L17.29 8.94a2.4 2.4 0 0 0-.33 1.04 2.4 2.4 0 0 0-1.12-.24H7.05a2.4 2.4 0 0 0-2.3 1.33L.35 18.67a2.4 2.4 0 0 0 0 2.66l4.4 7.61a2.4 2.4 0 0 0 2.3 1.32h8.79c.4 0 .78-.09 1.12-.25.05.37.16.72.33 1.04l4.39 7.61A2.4 2.4 0 0 0 23.98 40h8.79a2.4 2.4 0 0 0 2.3-1.33l4.4-7.61c.18-.32.3-.67.33-1.03.34.16.71.24 1.11.24h8.79a2.4 2.4 0 0 0 2.3-1.32l4.39-7.61a2.4 2.4 0 0 0 0-2.66Z"
            fill="#EFDF18"
          />
        </svg>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          EnergieBee
        </span>
      </div>

      {/* headline */}
      <div
        style={{
          marginTop: "48px",
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -1,
          textAlign: "center",
        }}
      >
        Smart home energy control
      </div>
      <div
        style={{
          marginTop: "16px",
          fontSize: 18,
          color: "#D7C638",
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Save up to £300 a year vs tado.
      </div>

      {/* phone preview */}
      <div
        style={{
          marginTop: "48px",
          width: "320px",
          height: "560px",
          borderRadius: "44px",
          background: "#1a1a1a",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: "36px",
            display: "flex",
            flexDirection: "column",
            padding: "32px 22px",
            color: "#0a0a0a",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: "14px" }}>
            Good Morning
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#2563EB",
              fontWeight: 600,
              marginBottom: "24px",
            }}
          >
            Energy · Solar · Heating
          </div>
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: "12px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Energy performance certificate
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                background: "#FAFAFA",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  background: "#F97316",
                  color: "white",
                  fontSize: 18,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                D
              </div>
              <span style={{ color: "#a3a3a3" }}>→</span>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  background: "#22C55E",
                  color: "white",
                  fontSize: 18,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                B
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 12,
                fontWeight: 700,
                gap: "6px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                £1,890/yr
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                £1,490/yr
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#FEF6C7",
                  borderRadius: "6px",
                  textAlign: "center",
                  color: "#15803D",
                }}
              >
                £400/yr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    { width: 640, height: 1136 },
  );
}
