import Link from "next/link";
import type { PersonSummary } from "@/lib/types";

const TONES = ["#3a1d12", "#10203a", "#24142a", "#0f2a24", "#18260f", "#2a1010", "#262010", "#161b2a"];

function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

export function Avatar({
  name,
  src,
  size = 32,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: toneFor(name) }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" /> : initial}
    </span>
  );
}

export function VerifiedMark({ size = 15, label = "Verified creator" }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} style={{ flex: "none" }}>
      <title>{label}</title>
      <path
        d="M12 1.5l2.7 2.2 3.5-.3.9 3.4 3 1.8-1.3 3.3 1.3 3.3-3 1.8-.9 3.4-3.5-.3L12 22.5l-2.7-2.2-3.5.3-.9-3.4-3-1.8L3.2 12 1.9 8.7l3-1.8.9-3.4 3.5.3z"
        fill="#60a5fa"
      />
      <path
        d="M8 12.2l2.6 2.6L16.2 9"
        fill="none"
        stroke="#0c0a09"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PersonLink({
  person,
  verified = false,
  size = 22,
}: {
  person: PersonSummary;
  verified?: boolean;
  size?: number;
}) {
  return (
    <Link href={`/u/${person.username}`} className="person-link">
      <Avatar name={person.display_name} src={person.avatar_url} size={size} />
      <span>{person.display_name}</span>
      {verified ? <VerifiedMark size={14} /> : null}
    </Link>
  );
}
