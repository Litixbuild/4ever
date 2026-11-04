"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { rankProgress, type Faction } from "@/lib/ranks";
import { XP_EVENT, getServerXpState, getXpState, initXp, subscribeXp, type XpEventDetail } from "@/lib/watch-xp";

type Seed = { xp: number; faction: Faction | null; loggedIn: boolean; username: string | null };

// Hands the logged-in person's saved XP to the browser-side tracker. Mounted once in the layout.
export function XpInit({ xp, faction, loggedIn }: Omit<Seed, "username">) {
  useEffect(() => {
    initXp({ xp, faction, loggedIn });
  }, [xp, faction, loggedIn]);
  return null;
}

function useXp(seed?: Seed) {
  const live = useSyncExternalStore(subscribeXp, getXpState, getServerXpState);
  // Before the tracker has loaded, show what the server sent so the bar doesn't flicker.
  if (!live.loggedIn && seed) return seed;
  return { ...live, username: seed?.username ?? null };
}

// The experience bar, like the one along the bottom of the game's action bars: a purple fill
// split into 20 bubbles. "tabbar" sits under the phone buttons, "header" under the desktop header,
// "feed" is a thin line along the bottom of the swipe feed.
export function XpBar({ variant, seed }: { variant: "tabbar" | "header" | "feed"; seed?: Seed }) {
  const { xp, faction, loggedIn, username } = useXp(seed);

  if (!loggedIn) {
    if (variant === "feed") return null;
    return (
      <Link href="/login" className={`xp xp-${variant} xp-guest`}>
        <span className="xp-track" />
        <span className="xp-label">Log in to earn ranks while you watch</span>
      </Link>
    );
  }

  const p = rankProgress(xp, faction);
  const label = p.maxed ? `${p.name} · Rank ${p.rank} · Max rank` : `${p.name} · Rank ${p.rank} · ${p.percent}%`;
  const style = { "--xp": `${p.percent}%` } as CSSProperties;

  if (variant === "feed") {
    return (
      <div className="xp xp-feed" style={style} role="progressbar" aria-label={label} aria-valuenow={p.percent}>
        <span className="xp-track">
          <span className="xp-fill" />
        </span>
      </div>
    );
  }

  return (
    <Link
      href={username ? `/u/${username}#ranks` : "/settings"}
      className={`xp xp-${variant}`}
      style={style}
      aria-label={`${label}. Watching videos fills the bar.`}
    >
      <span className="xp-track">
        <span className="xp-fill" />
      </span>
      <span className="xp-label">
        <span>
          <span className={`rarity-${p.rarity}`}>{p.name}</span>
          {` · Rank ${p.rank} · ${p.maxed ? "Max rank" : `${p.percent}%`}`}
        </span>
      </span>
    </Link>
  );
}

// "Rank up" banner, shown when a minute of watching tips someone into the next rank.
export function RankToast() {
  const [shown, setShown] = useState<{ name: string; rank: number; rarity: string; key: number } | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    function onXp(event: Event) {
      const detail = (event as CustomEvent<XpEventDetail>).detail;
      if (!detail?.rankedUp) return;
      const p = rankProgress(detail.xp, getXpState().faction);
      setShown({ name: p.name, rank: p.rank, rarity: p.rarity, key: Date.now() });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShown(null), 5000);
    }
    window.addEventListener(XP_EVENT, onXp);
    return () => {
      window.removeEventListener(XP_EVENT, onXp);
      window.clearTimeout(timer);
    };
  }, []);

  if (!shown) return null;
  return (
    <div className="rank-toast" role="status" key={shown.key}>
      <span className="rank-toast-eyebrow">Rank up</span>
      <span className={`rank-toast-name rarity-${shown.rarity}`}>{shown.name}</span>
      <span className="rank-toast-sub">Rank {shown.rank}</span>
    </div>
  );
}
