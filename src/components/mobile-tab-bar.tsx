"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PlusIcon } from "@/components/icons";

// Phones only (hidden by CSS above 760px). Clips and Movies are tabs at the top (MainNav); this dock
// holds the experience bar along the bottom and a small gold Submit button floating just above it.
// The swipe feed (/watch) covers it.
export function MobileTabBar({ meter }: { meter?: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="dock">
      {pathname === "/submit" ? null : (
        <Link href="/submit" className="dock-submit" aria-label="Submit a clip">
          <PlusIcon size={22} />
        </Link>
      )}
      <div className="dock-bar">{meter}</div>
    </div>
  );
}
