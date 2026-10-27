import Link from "next/link";
import { DiamondIcon, DotIcon, TrophyIcon } from "@/components/icons";
import { LaunchCountdown } from "@/components/launch-countdown";
import { Avatar } from "@/components/people";
import { badgeInfo } from "@/lib/badges";
import { contestPhase, contestStatusLine, contestTileDate, type ContestPhase } from "@/lib/contests";
import { dateTile, formatCount, formatDate, formatDateTime } from "@/lib/format";
import type { ActivityItem, TopCreator } from "@/lib/queries";
import { rarityClass } from "@/lib/rarity";
import { site } from "@/lib/site";
import type { Contest } from "@/lib/types";

// Prizes are listed like loot, best first.
export const PRIZE_COLORS = ["var(--q-legendary)", "var(--q-epic)", "var(--q-rare)", "var(--q-uncommon)"];

const PHASE_LABELS: Record<ContestPhase, string> = {
  upcoming: "Coming up",
  open: "Open for entries",
  voting: "Voting",
  ended: "Finished",
};

// Whether to show the launch banner, and whether Forever is live yet.
function launchState(now = Date.now()) {
  return {
    show: now <= new Date(site.launchBannerUntil).getTime(),
    live: now >= new Date(site.launchAt).getTime(),
  };
}

export function LaunchBar() {
  const { show, live } = launchState();
  if (!show) return null;
  return (
    <section aria-label="Launch" className="launch-bar">
      <span className="launch-sigil" aria-hidden="true">
        <DotIcon size={8} color="var(--q-legendary)" />
      </span>
      <p>
        {live ? (
          <>
            <strong>World of Warcraft: Forever is live.</strong> Share your first-day moments and get featured.
          </>
        ) : (
          <>
            <strong>World of Warcraft: Forever</strong> goes live Nov 4 at 6 PM ET
          </>
        )}
      </p>
      {live ? null : <LaunchCountdown at={site.launchAt} />}
      <Link href="/submit" className="launch-link">
        Share a launch clip
      </Link>
    </section>
  );
}

export function PhaseBadge({ phase }: { phase: ContestPhase }) {
  return (
    <span className={`phase phase-${phase}`}>
      <DotIcon size={7} color="currentColor" />
      {PHASE_LABELS[phase]}
    </span>
  );
}

export function PrizeList({ prizes }: { prizes: string[] }) {
  return (
    <ul className="diamond-list">
      {prizes.map((prize, i) => (
        <li key={prize}>
          <DiamondIcon color={PRIZE_COLORS[i % PRIZE_COLORS.length]} />
          {prize}
        </li>
      ))}
    </ul>
  );
}

// The three dates every contest runs on, with the one coming up next highlighted.
// Dates only in `compact` mode (the contests page feature); full times on the contest page itself.
export function ContestTimeline({ contest, compact = false }: { contest: Contest; compact?: boolean }) {
  const phase = contestPhase(contest);
  const current = { upcoming: 0, open: 1, voting: 2, ended: 3 }[phase];
  const steps = [
    { label: "Entries open", at: contest.opens_at },
    { label: "Entries close", at: contest.closes_at },
    { label: "Voting ends", at: contest.ends_at },
  ];
  return (
    <ol className="timeline">
      {steps.map((step, i) => (
        <li key={step.label} data-state={i < current ? "done" : i === current ? "next" : "later"}>
          <span className="timeline-mark">{["I", "II", "III"][i]}</span>
          <span className="timeline-text">
            <strong>{step.label}</strong>
            <span>{compact ? formatDate(step.at) : formatDateTime(step.at)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ContestCard({ contest, compact = false }: { contest: Contest; compact?: boolean }) {
  const tile = dateTile(contestTileDate(contest));
  const phase = contestPhase(contest);
  return (
    <section aria-labelledby={`contest-${contest.id}`} className="card-contest stack">
      <div className="row" style={{ gap: 14, flexWrap: "nowrap", alignItems: "flex-start" }}>
        <span className="date-tile" aria-hidden="true">
          <span className="m">{tile.month}</span>
          <span className="d">{tile.day}</span>
        </span>
        <div className="stack-sm" style={{ gap: 6, minWidth: 0 }}>
          <PhaseBadge phase={phase} />
          <h2 id={`contest-${contest.id}`} className="h2" style={{ fontSize: 26 }}>
            <Link href={`/contests/${contest.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
              {contest.title}
            </Link>
          </h2>
        </div>
      </div>
      {contest.tagline ? <p style={{ margin: 0, color: "var(--text-3)" }}>{contest.tagline}</p> : null}
      <p className="small" style={{ margin: 0, color: "var(--text-2)" }}>
        {contestStatusLine(contest)}
      </p>
      {!compact && contest.prizes.length > 0 ? <PrizeList prizes={contest.prizes} /> : null}
      <Link href={`/contests/${contest.slug}`} className="btn btn-outline-gold btn-block">
        {phase === "upcoming"
          ? "See the details"
          : phase === "open"
            ? "Enter or vote"
            : phase === "voting"
              ? "Vote on the entries"
              : "See the results"}
      </Link>
    </section>
  );
}

export function TopCreatorsCard({ creators }: { creators: TopCreator[] }) {
  return (
    <section aria-labelledby="top-creators" className="card stack-sm" style={{ gap: 6 }}>
      <div className="row-between" style={{ alignItems: "baseline" }}>
        <h2 id="top-creators" className="h-gold">
          Top creators
        </h2>
        <span className="tiny muted">Votes this week</span>
      </div>
      {creators.length === 0 ? (
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          Nobody yet. Votes on verified creators&apos; videos put them here.
        </p>
      ) : (
        <ol className="list-plain ranked">
          {creators.map((creator, i) => (
            <li key={creator.id}>
              <span className={`rank ${i === 0 ? "rank-first" : ""}`}>{i + 1}</span>
              <Avatar name={creator.display_name} src={creator.avatar_url} size={34} />
              <Link href={`/u/${creator.username}`} className="ranked-name">
                {creator.display_name}
              </Link>
              <span className="small muted" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {formatCount(creator.votes)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// Recent community activity: new videos (titles in their view color) and achievements.
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const lines = items.filter((item) => item.type !== "contest");
  return (
    <section aria-labelledby="latest-activity" className="chat">
      <div className="chat-tab">
        <h2 id="latest-activity">Latest</h2>
      </div>
      <div className="chat-frame">
        {lines.length === 0 ? (
          <p className="chat-line chat-system">Quiet in here. Be the first to share something.</p>
        ) : (
          lines.map((item) => {
            if (item.type === "clip") {
              const who = item.clip.creator?.display_name ?? item.clip.channel_name;
              return (
                <p key={`c-${item.clip.id}`} className="chat-line">
                  {item.clip.creator ? (
                    <Link href={`/u/${item.clip.creator.username}`} className="chat-name">
                      {who}
                    </Link>
                  ) : (
                    <span className="chat-name">{who}</span>
                  )}{" "}
                  shared{" "}
                  <Link href={`/c/${item.clip.short_id}`} className={`chat-item ${rarityClass(item.clip.view_count)}`}>
                    {item.clip.title}
                  </Link>
                </p>
              );
            }
            if (item.type === "badge") {
              const badge = badgeInfo(item.badge);
              return (
                <p key={`b-${item.person.username}-${item.badge}`} className="chat-line">
                  <Link href={`/u/${item.person.username}`} className="chat-name">
                    {item.person.display_name}
                  </Link>{" "}
                  unlocked <span className="chat-ach">{badge?.name ?? "an achievement"}</span>
                </p>
              );
            }
            return null;
          })
        )}
      </div>
    </section>
  );
}

// Stands in for contests until they start.
export function ContestsSoon() {
  return (
    <section aria-labelledby="contests-soon" className="card-contest stack" style={{ gap: 8 }}>
      <span className="row small" style={{ gap: 8, color: "var(--flavor)", fontWeight: 700 }}>
        <TrophyIcon size={15} /> Coming soon
      </span>
      <h2 id="contests-soon" className="h2" style={{ fontSize: 24 }}>
        Contests
      </h2>
      <p className="small" style={{ margin: 0, color: "var(--text-3)" }}>
        Contests are coming shortly. We&apos;ll announce the first one here.
      </p>
    </section>
  );
}

export function CreatorsBand() {
  return (
    <section aria-labelledby="creators-band" className="band">
      <div className="stack" style={{ flex: "1 1 380px", gap: 14 }}>
        <h2 id="creators-band" className="h2">
          Made a movie? Bring it home.
        </h2>
        <p className="lead" style={{ maxWidth: 480 }}>
          Your video stays on your channel. 4Ever gives it a front page, a crowd that cares about the craft, and credit
          that always points back to you.
        </p>
        <div className="row" style={{ marginTop: 6 }}>
          <Link href="/submit" className="btn btn-gold btn-lg">
            Submit a Clip
          </Link>
          <Link href="/music-guide" className="btn btn-ghost btn-lg">
            Read the music guide
          </Link>
        </div>
      </div>
      <ol className="steps band-steps">
        <li>
          <span className="numeral">I</span>
          <strong>Paste a link</strong>
          <span className="small muted">YouTube or Twitch. Nothing to upload.</span>
        </li>
        <li>
          <span className="numeral">II</span>
          <strong>Get the credit</strong>
          <span className="small muted">
            We read the real channel from YouTube or Twitch, so credit can&apos;t be faked.
          </span>
        </li>
        <li>
          <span className="numeral">III</span>
          <strong>Get featured</strong>
          <span className="small muted">Earn titles and a spot in the Hall of Fame.</span>
        </li>
      </ol>
    </section>
  );
}
