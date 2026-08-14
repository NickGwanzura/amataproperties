import { ImageResponse } from "next/og";
import { company } from "@/config";

export const runtime = "edge";
export const alt = `${company.name}: Premium Stands in Zimbabwe`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#171114",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "Manrope, system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "7px",
            background: "linear-gradient(90deg, #7D0B12, #D71920, #B89050)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "28px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "99px",
            padding: "8px 18px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#D71920",
            }}
          />
          <span
            style={{
              color: "#D71920",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Zimbabwe&apos;s Trusted Property Partner
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            marginBottom: "22px",
            letterSpacing: "-0.02em",
          }}
        >
          {company.shortName}
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "52px",
            lineHeight: 1.3,
          }}
        >
          {company.name}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.5,
            maxWidth: "680px",
          }}
        >
          Buy, sell, lease, and manage property with confidence across Zimbabwe.
          Browse, reserve, and own. All online.
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "40px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #D71920, #7D0B12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "white",
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "18px",
              letterSpacing: "0.04em",
            }}
          >
            amataproperties.com
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
