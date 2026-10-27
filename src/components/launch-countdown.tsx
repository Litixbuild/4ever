"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60 };
}

// Days, hours and minutes until launch. Filled in after the page loads so the server and browser agree,
// and refreshed twice a minute rather than every second, so it stays calm.
export function LaunchCountdown({ at }: { at: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(at).getTime();
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [at]);

  if (left === null) return <span className="countdown" aria-hidden="true" />;
  if (left <= 0) return <span className="countdown">Live now</span>;
  const { days, hours, minutes } = parts(left);
  const label = `${days} days, ${hours} hours and ${minutes} minutes to go`;
  return (
    <span className="countdown" role="timer" aria-label={label}>
      <span>
        <b>{days}</b>d
      </span>
      <span>
        <b>{String(hours).padStart(2, "0")}</b>h
      </span>
      <span>
        <b>{String(minutes).padStart(2, "0")}</b>m
      </span>
    </span>
  );
}
