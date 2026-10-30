"use client";

import { OPEN_CLASS_PICKER } from "@/components/class-picker";

// Reopens the "choose your class" screen.
export function OpenClassPicker({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => window.dispatchEvent(new Event(OPEN_CLASS_PICKER))}>
      {label}
    </button>
  );
}
