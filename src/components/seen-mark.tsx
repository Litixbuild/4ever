"use client";

import { useSyncExternalStore } from "react";
import { CheckIcon } from "@/components/icons";
import { readSeenRaw, subscribeSeen } from "@/lib/seen";

// "Watched" in the top-right corner of a thumbnail, once this browser has played the clip.
export function SeenMark({ clipId }: { clipId: string }) {
  const raw = useSyncExternalStore(subscribeSeen, readSeenRaw, () => "[]");
  if (!raw.includes(`"${clipId}"`)) return null;
  return (
    <span className="overlay-chip overlay-tr seen-mark">
      <CheckIcon size={12} /> Watched
    </span>
  );
}
