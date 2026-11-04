import Link from "next/link";
import type { CSSProperties } from "react";
import { MAX_RANK, RANK_START, rankName, rankProgress, rankRarity, type Faction } from "@/lib/ranks";
import { RARITY_TIERS } from "@/lib/rarity";

const rarityColor = (key: string) => RARITY_TIERS.find((t) => t.key === key)?.color ?? "#f1e9da";

// A small shield with the rank number, in the rank's quality color. Drawn for 4Ever (not the game's art).
export function RankInsignia({ rank, earned, size = 40 }: { rank: number; earned: boolean; size?: number }) {
  const color = earned ? rarityColor(rankRarity(rank)) : "#5c5346";
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" aria-hidden="true" className="rank-insignia">
      <path
        d="M20 2 L37 8 V22 C37 33 29 40 20 44 C11 40 3 33 3 22 V8 Z"
        fill={earned ? "#1a1510" : "#100d0b"}
        stroke={color}
        strokeWidth={2}
      />
      <path
        d="M20 6 L33 10.5 V22 C33 30.5 27 36 20 39.5 C13 36 7 30.5 7 22 V10.5 Z"
        fill="none"
        stroke={color}
        strokeOpacity={0.35}
      />
      <text
        x="20"
        y="27.5"
        textAnchor="middle"
        fontSize={rank >= 10 ? 14 : 16}
        fontWeight={800}
        fill={color}
        fontFamily="var(--font-display), serif"
      >
        {rank}
      </text>
    </svg>
  );
}

// Profile section: the current rank with its bar, then all 14 ranks, earned ones lit in their color.
export function RankList({ xp, faction, isOwn }: { xp: number; faction: Faction | null; isOwn: boolean }) {
  const p = rankProgress(xp, faction);
  const toNext = p.maxed ? 0 : p.needed - p.into;

  return (
    <section aria-labelledby="ranks" className="stack" style={{ gap: 16 }}>
      <h2 id="ranks" className="h2">
        Rank
      </h2>
      <div className="rank-now card">
        <RankInsignia rank={p.rank} earned size={54} />
        <div className="stack-sm" style={{ gap: 8, flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
            <span className={`rank-now-name rarity-${p.rarity}`}>{p.name}</span>
            <span className="small muted">Rank {p.rank}</span>
          </div>
          <div className="xp xp-profile" style={{ "--xp": `${p.percent}%` } as CSSProperties}>
            <span className="xp-track">
              <span className="xp-fill" />
            </span>
            <span className="xp-label">{p.maxed ? "Max rank" : `${p.percent}%`}</span>
          </div>
          <span className="small muted">
            {p.maxed
              ? "The highest rank there is."
              : `${toNext} more ${toNext === 1 ? "minute" : "minutes"} of watching to reach ${rankName(p.rank + 1, faction)}.`}
          </span>
          {!faction && isOwn ? (
            <span className="small">
              <Link href="/settings">Pick Horde or Alliance</Link> to earn your faction&apos;s rank titles.
            </span>
          ) : null}
        </div>
      </div>
      <ol className="rank-grid">
        {Array.from({ length: MAX_RANK }, (_, i) => i + 1).map((rank) => {
          const earned = rank <= p.rank;
          return (
            <li key={rank} className={`rank-cell ${earned ? "" : "is-locked"}`}>
              <RankInsignia rank={rank} earned={earned} />
              <span className={`rank-cell-name ${earned ? `rarity-${rankRarity(rank)}` : ""}`}>
                {rankName(rank, faction)}
              </span>
              <span className="tiny faint">{earned ? "Earned" : `${formatHours(RANK_START[rank - 1])} watched`}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours < 10 ? hours.toFixed(1).replace(/\.0$/, "") : Math.round(hours)} hr`;
}
