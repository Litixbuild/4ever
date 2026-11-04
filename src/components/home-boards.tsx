import Link from "next/link";
import { ClipCard } from "@/components/clip-card";
import { PlusIcon } from "@/components/icons";
import { PlayerMadeMark } from "@/components/player-made";
import { categoryLabel } from "@/lib/categories";
import { formatCount } from "@/lib/format";
import type { FactionSide, FactionWar } from "@/lib/queries";
import type { Clip } from "@/lib/types";

// How far the front line sits from the left (Horde) edge, as a percentage. An empty week is a draw; the
// line never quite reaches an edge, so both sides always show.
export function frontLine(war: FactionWar) {
  const total = war.horde.minutes + war.alliance.minutes;
  if (total <= 0) return 50;
  return Math.min(92, Math.max(8, Math.round((war.horde.minutes / total) * 1000) / 10));
}

function minutesLabel(minutes: number) {
  return `${formatCount(minutes)} ${minutes === 1 ? "minute" : "minutes"}`;
}

function Leaders({ side, faction }: { side: FactionSide; faction: "horde" | "alliance" }) {
  if (side.leaders.length === 0) {
    return (
      <span className="war-leaders war-empty">
        No one yet. Watch to fight for the {faction === "horde" ? "Horde" : "Alliance"}.
      </span>
    );
  }
  return (
    <ol className="war-leaders">
      {side.leaders.map((leader) => (
        <li key={leader.username}>
          <Link href={`/u/${leader.username}`}>{leader.name}</Link>
          <span>{formatCount(leader.minutes)}m</span>
        </li>
      ))}
    </ol>
  );
}

// Horde vs Alliance: minutes watched this week by each side. The gold seam is where the two meet,
// pushed toward whoever is losing.
export function FactionWarBar({ war }: { war: FactionWar }) {
  const line = frontLine(war);
  const total = war.horde.minutes + war.alliance.minutes;
  const leader =
    war.horde.minutes === war.alliance.minutes ? null : war.horde.minutes > war.alliance.minutes ? "Horde" : "Alliance";
  return (
    <section aria-labelledby="war-title" className="war">
      <div className="war-head">
        <h2 id="war-title" className="war-title">
          Faction war
        </h2>
        <p className="war-sub">
          {total === 0
            ? "Every minute you watch this week counts for your faction."
            : leader
              ? `The ${leader} leads this week. Every minute you watch counts for your faction.`
              : "Dead even this week. Every minute you watch counts for your faction."}
        </p>
      </div>

      <div className="war-sides">
        <span className="war-side war-side-horde">
          <strong>Horde</strong>
          {minutesLabel(war.horde.minutes)}
        </span>
        <span className="war-side war-side-alliance">
          <strong>Alliance</strong>
          {minutesLabel(war.alliance.minutes)}
        </span>
      </div>

      <div
        className="war-bar"
        role="img"
        aria-label={`Horde ${minutesLabel(war.horde.minutes)}, Alliance ${minutesLabel(war.alliance.minutes)} watched this week`}
        style={{ "--front": `${line}%` } as React.CSSProperties}
      >
        <span className="war-fill war-fill-horde">
          <span className="war-sparks" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </span>
        <span className="war-fill war-fill-alliance">
          <span className="war-sparks" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </span>
        <span className="war-seam" aria-hidden="true" />
      </div>

      <div className="war-foot">
        <Leaders side={war.horde} faction="horde" />
        <Leaders side={war.alliance} faction="alliance" />
      </div>
    </section>
  );
}

const TILE_CATEGORIES = ["world-pvp", "battlegrounds", "raids-dungeons", "funny"] as const;
export const HOME_CATEGORIES: string[] = [...TILE_CATEGORIES];

// Big picture tiles into the browse page, one per favourite kind of video.
export function CategoryTiles({ covers }: { covers: Record<string, string | null> }) {
  return (
    <nav aria-label="Categories" className="cat-tiles">
      {TILE_CATEGORIES.map((category) => {
        const cover = covers[category];
        return (
          <Link key={category} href={`/browse?cat=${category}`} className={`cat-tile cat-${category}`}>
            {cover ? <img src={cover} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
            <span className="cat-tile-name">{categoryLabel(category)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// Videos players cut and edited themselves, with a quick way to add one.
export function PlayerMadeShelf({ clips }: { clips: Clip[] }) {
  return (
    <section aria-labelledby="made-title" className="made-shelf">
      <div className="made-head">
        <h2 id="made-title" className="made-title">
          <PlayerMadeMark />
          <span>Made by players</span>
        </h2>
        <Link href="/submit" className="made-add" aria-label="Share a video you made" title="Share a video you made">
          <PlusIcon size={22} />
        </Link>
      </div>
      {clips.length > 0 ? (
        <div className="made-row">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      ) : (
        <p className="made-empty">
          Movies and edits players made themselves land here first. Cut something together in Forever? Press the plus to
          share it.
        </p>
      )}
    </section>
  );
}
