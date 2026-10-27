import Link from "next/link";

// The 4: a map of Azeroth inside a gold frame. 96px and 192px files cover normal and sharp screens.
export function FourMark({ height = 48, className = "" }: { height?: number; className?: string }) {
  const width = Math.round(height * (85 / 96));
  return (
    <img
      src="/brand/four-96.webp"
      srcSet="/brand/four-96.webp 1x, /brand/four-192.webp 2x, /brand/four-384.webp 4x"
      width={width}
      height={height}
      alt=""
      className={`four-mark ${className}`}
      decoding="async"
    />
  );
}

// "EVER" beside the 4: EV burns Horde red, ER glows Alliance blue. The glow moves; see .glow-* in globals.css.
export function EverWord({ className = "" }: { className?: string }) {
  return (
    <span className={`ever-word ${className}`} aria-hidden="true">
      <span className="glow glow-ev" data-text="EV">
        EV
      </span>
      <span className="glow glow-er" data-text="ER">
        ER
      </span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="4Everclips home">
      <FourMark />
      <EverWord />
      <span className="logo-tag">CLIPS</span>
    </Link>
  );
}
