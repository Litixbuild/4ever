// An illustrated twilight landscape. Used when a video has no thumbnail
// and for profile banners. Colors are picked from a seed so each one differs.

const SCENES = [
  { sky: "#2b140d", glow: "#ffb35c", far: "#3b1c12", mid: "#24110b", near: "#150a06" },
  { sky: "#0f1a2e", glow: "#d6e4ff", far: "#18263f", mid: "#101a2c", near: "#0a101b" },
  { sky: "#15241a", glow: "#c6f5d2", far: "#1d3123", mid: "#132217", near: "#0b150e" },
  { sky: "#1f1430", glow: "#e6ccff", far: "#2a1c40", mid: "#1a1129", near: "#100a19" },
  { sky: "#10302c", glow: "#ffe6a8", far: "#17423b", mid: "#0f2c27", near: "#091b18" },
  { sky: "#2c0f12", glow: "#ff9a8a", far: "#3d161a", mid: "#250c0f", near: "#160709" },
  { sky: "#2a2412", glow: "#ffe08a", far: "#3a3118", mid: "#241e0e", near: "#151108" },
  { sky: "#161b28", glow: "#dde4f2", far: "#212839", mid: "#151a26", near: "#0c0f17" },
];

const RIDGES = [
  {
    far: "M0 112 L36 88 L70 104 L112 64 L150 98 L196 74 L238 102 L282 80 L320 94 L320 180 L0 180 Z",
    mid: "M0 138 L60 116 L104 132 L156 110 L214 136 L264 118 L320 132 L320 180 L0 180 Z",
    near: "M0 158 Q80 142 160 156 T320 150 L320 180 L0 180 Z",
    gx: 236,
    gy: 54,
  },
  {
    far: "M0 100 L50 80 L90 96 L134 58 L170 86 L214 66 L262 92 L300 72 L320 82 L320 180 L0 180 Z",
    mid: "M0 132 L48 120 L98 140 L150 116 L200 130 L254 112 L320 128 L320 180 L0 180 Z",
    near: "M0 152 Q90 166 170 150 T320 160 L320 180 L0 180 Z",
    gx: 74,
    gy: 50,
  },
  {
    far: "M0 118 L44 96 L84 110 L130 84 L176 106 L222 78 L270 100 L320 88 L320 180 L0 180 Z",
    mid: "M0 140 L70 124 L120 138 L180 118 L240 140 L320 126 L320 180 L0 180 Z",
    near: "M0 160 Q100 148 200 160 T320 156 L320 180 L0 180 Z",
    gx: 160,
    gy: 46,
  },
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function Vista({ seed, wide = false }: { seed: string; wide?: boolean }) {
  const h = hash(seed);
  const scene = SCENES[h % SCENES.length];
  const ridge = RIDGES[(h >>> 3) % RIDGES.length];
  return (
    <svg
      viewBox={wide ? "0 40 320 140" : "0 0 320 180"}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="320" height="180" fill={scene.sky} />
      <circle cx={ridge.gx} cy={ridge.gy} r="44" fill={scene.glow} opacity="0.08" />
      <circle cx={ridge.gx} cy={ridge.gy} r="26" fill={scene.glow} opacity="0.16" />
      <circle cx={ridge.gx} cy={ridge.gy} r="13" fill={scene.glow} opacity="0.8" />
      <circle cx="30" cy="24" r="0.9" fill="#f5e6c8" opacity="0.5" />
      <circle cx="120" cy="40" r="0.8" fill="#f5e6c8" opacity="0.45" />
      <circle cx="200" cy="18" r="0.9" fill="#f5e6c8" opacity="0.5" />
      <circle cx="290" cy="34" r="0.8" fill="#f5e6c8" opacity="0.4" />
      <path d={ridge.far} fill={scene.far} />
      <path d={ridge.mid} fill={scene.mid} />
      <path d={ridge.near} fill={scene.near} />
    </svg>
  );
}
