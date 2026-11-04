"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FilmIcon, PlayIcon } from "@/components/icons";

const LINKS = [
  {
    href: "/browse?kind=movie",
    label: "Movies",
    icon: <FilmIcon size={17} />,
    match: (p: string, k: string | null) => p === "/browse" && k === "movie",
  },
  {
    href: "/browse?kind=clip",
    // On phones, Clips opens the swipe feed instead of the grid.
    mobileHref: "/watch",
    label: "Clips",
    icon: <PlayIcon size={15} />,
    first: true,
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
            <Link
              href={link.mobileHref}
              className={`nav-narrow ${"first" in link ? "nav-first" : ""}`}
              aria-current={current}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </Link>
          </span>
        ) : (
          <Link key={link.href} href={link.href} aria-current={current}>
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
