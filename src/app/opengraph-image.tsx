import { ImageResponse } from "next/og";

export const alt = "4Everclips: movies and clips from World of Warcraft: Forever";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview image shown when someone shares a 4Ever link.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0a09",
          color: "#f1e9da",
          gap: 28,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 30 30">
          <path d="M15 2 L28 15 L15 28 L2 15 Z" fill="none" stroke="#e2b65c" strokeWidth="2" />
          <path d="M15 9 L21 15 L15 21 L9 15 Z" fill="#e2b65c" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 110, fontWeight: 900, letterSpacing: 12 }}>4EVER</span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 10,
              color: "#e2b65c",
              border: "3px solid rgba(226,182,92,0.6)",
              borderRadius: 10,
              padding: "6px 14px",
            }}
          >
            CLIPS
          </span>
        </div>
        <span style={{ fontSize: 36, color: "#c8bda9" }}>Movies and clips from World of Warcraft: Forever</span>
      </div>
    ),
    size,
  );
}
