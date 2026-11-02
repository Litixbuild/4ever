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
      {/* Contests aren't open yet: shown, greyed out, and not a link. */}
      <span className="nav-soon" aria-disabled="true" title="Contests are coming soon">
        Contests
      </span>
    </nav>
  );
}
