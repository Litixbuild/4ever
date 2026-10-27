"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  {
    href: "/browse?kind=movie",
    label: "Movies",
    match: (p: string, k: string | null) => p === "/browse" && k === "movie",
  },
  {
    href: "/browse?kind=clip",
    // On phones, Clips opens the swipe feed instead of the grid.
    mobileHref: "/watch",
    label: "Clips",
    match: (p: string, k: string | null) => (p === "/browse" && k === "clip") || p === "/watch",
  },
  { href: "/contests", label: "Contests", match: (p: string) => p.startsWith("/contests") },
  { href: "/creators", label: "Creators", match: (p: string) => p.startsWith("/creators") || p.startsWith("/u/") },
  { href: "/hall-of-fame", label: "Hall of Fame", match: (p: string) => p.startsWith("/hall-of-fame") },
];

export function MainNav() {
  const pathname = usePathname();
  const kind = useSearchParams().get("kind");
  return (
    <nav aria-label="Main" className="main-nav">
      {LINKS.map((link) => {
        const current = link.match(pathname, kind) ? "page" : undefined;
        return "mobileHref" in link && link.mobileHref ? (
          <span key={link.href} className="nav-pair">
            <Link href={link.href} className="nav-wide" aria-current={current}>
              {link.label}
            </Link>
            <Link href={link.mobileHref} className="nav-narrow" aria-current={current}>
              {link.label}
            </Link>
          </span>
        ) : (
          <Link key={link.href} href={link.href} aria-current={current}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
