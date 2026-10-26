"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

// A dropdown that closes when you navigate, click elsewhere, or press Escape.
export function UserMenu({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current?.open && !ref.current.contains(event.target as Node)) ref.current.open = false;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="user-menu">
      <summary>{summary}</summary>
      <div className="user-menu-panel">{children}</div>
    </details>
  );
}
