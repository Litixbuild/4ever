"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/browse?kind=movie", label: "Movies", match: (p: string, k: string | null) => p === "/browse" && k === "movie" },
  { href: "/browse?kind=clip", label: "Clips", match: (p: string, k: string | null) => p === "/browse" && k === "clip" },
  { href: "/contests", label: "Contests", match: (p: string) => p.startsWith("/contests") },
  { href: "/creators", label: "Creators", match: (p: string) => p.startsWith("/creators") || p.startsWith("/u/") },
  { href: "/hall-of-fame", label: "Hall of Fame", match: (p: string) => p.startsWith("/hall-of-fame") },
];

export function MainNav() {
  const pathname = usePathname();
  const kind = useSearchParams().get("kind");
  return (
    <nav aria-label="Main" className="main-nav">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.match(pathname, kind) ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
