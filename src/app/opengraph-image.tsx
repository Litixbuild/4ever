import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "4Everclips: movies and clips from World of Warcraft: Forever";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview image shown when someone shares a 4Ever link: the Alliance and Horde art,
// with the wordmark and tagline set in the site's own lettering.
export default async function OpengraphImage() {
  const root = process.cwd();
  const [art, cinzel, marcellus] = await Promise.all([
    readFile(join(root, "public/backdrop/og.jpg")),
    readFile(join(root, "node_modules/@fontsource/cinzel/files/cinzel-latin-900-normal.woff")),
    readFile(join(root, "node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff")),
  ]);
  const artUrl = `data:image/jpeg;base64,${art.toString("base64")}`;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0c0a09" }}>
      <img src={artUrl} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0 }} alt="" />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: "flex",
          background:
            "linear-gradient(90deg, rgba(10,8,7,0) 0%, rgba(10,8,7,0.45) 28%, rgba(10,8,7,0.55) 50%, rgba(10,8,7,0.45) 72%, rgba(10,8,7,0) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          color: "#f1e9da",
        }}
      >
        <svg width="84" height="84" viewBox="0 0 30 30">
          <path d="M15 2 L28 15 L15 28 L2 15 Z" fill="none" stroke="#e2b65c" strokeWidth="2" />
          <path d="M15 9 L21 15 L15 21 L9 15 Z" fill="#e2b65c" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <span
            style={{ fontFamily: "Cinzel", fontSize: 124, letterSpacing: 14, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}
          >
            4EVER
          </span>
          <span
            style={{
              fontFamily: "Cinzel",
              fontSize: 30,
              letterSpacing: 9,
              color: "#e2b65c",
              border: "3px solid rgba(226,182,92,0.7)",
              borderRadius: 10,
              padding: "6px 14px",
            }}
          >
            CLIPS
          </span>
        </div>
        <span
          style={{ fontFamily: "Marcellus", fontSize: 40, color: "#ffd100", textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
        >
          Movies and clips from World of Warcraft: Forever
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Cinzel", data: cinzel, weight: 900, style: "normal" },
        { name: "Marcellus", data: marcellus, weight: 400, style: "normal" },
      ],
    },
  );
}
