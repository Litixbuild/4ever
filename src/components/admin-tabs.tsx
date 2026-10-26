"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs({ pending }: { pending: number }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin", label: pending > 0 ? `Review queue (${pending})` : "Review queue" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/featured", label: "Movie of the Week" },
    { href: "/admin/contests", label: "Contests" },
    { href: "/admin/videos", label: "Videos" },
    { href: "/admin/people", label: "People" },
  ];
  return (
    <nav aria-label="Admin" className="seg" style={{ alignSelf: "flex-start" }}>
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
