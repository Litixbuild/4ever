"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { FilmIcon, PlayIcon, PlusIcon } from "@/components/icons";

// Phones only (hidden by CSS above 760px): a bottom bar styled like a WoW action bar.
// Movies on the left, Submit raised in the middle, Clips on the right.
// The swipe feed (/watch) covers it, so it never sits over a playing clip.
export function MobileTabBar({ meter }: { meter?: ReactNode }) {
  const pathname = usePathname();
  const kind = useSearchParams().get("kind");
  const at = (match: boolean) => (match ? "page" : undefined);

  return (
    <nav aria-label="Main" className="tabbar">
      <div className="tabbar-buttons">
        <Link href="/browse?kind=movie" className="tab" aria-current={at(pathname === "/browse" && kind === "movie")}>
          <span className="tab-slot">
            <FilmIcon size={19} />
          </span>
          <span className="tab-label">Movies</span>
        </Link>
        <Link href="/submit" className="tab tab-submit" aria-current={at(pathname === "/submit")}>
          <span className="tab-slot">
            <PlusIcon size={22} />
          </span>
          <span className="tab-label">Submit</span>
        </Link>
        <Link
          href="/watch"
          className="tab"
          aria-current={at(pathname === "/watch" || (pathname === "/browse" && kind === "clip"))}
        >
          <span className="tab-slot">
            <PlayIcon size={17} style={{ marginLeft: 2 }} />
          </span>
          <span className="tab-label">Clips</span>
        </Link>
      </div>
      {meter}
    </nav>
  );
}
