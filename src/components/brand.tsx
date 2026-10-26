import Link from "next/link";

export function Emblem({ size = 30, color = "var(--gold)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <path d="M15 2 L28 15 L15 28 L2 15 Z" stroke={color} strokeWidth="2" />
      <path d="M15 9 L21 15 L15 21 L9 15 Z" fill={color} />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="4Everclips home">
      <Emblem />
      <span className="logo-word">4EVER</span>
      <span className="logo-tag">CLIPS</span>
    </Link>
  );
}
