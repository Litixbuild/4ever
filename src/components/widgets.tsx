import Link from "next/link";
import { DiamondIcon, DotIcon, TrophyIcon } from "@/components/icons";
import { LaunchCountdown } from "@/components/launch-countdown";
import { badgeInfo } from "@/lib/badges";
import { contestPhase, contestStatusLine, contestTileDate, type ContestPhase } from "@/lib/contests";
import { dateTile, formatDate, formatDateTime } from "@/lib/format";
import type { ActivityItem } from "@/lib/queries";
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
            <strong>
              <span className="launch-extra">World of Warcraft: </span>Forever is live.
            </strong>{" "}
            <span className="launch-extra">Share your first-day moments and get featured.</span>
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
              const clip = item.clip;
              const title = (
                <Link href={`/c/${clip.short_id}`} className={`chat-item ${rarityClass(clip.view_count)}`}>
                  {clip.title}
                </Link>
              );
              // "X shared" only when X really posted it here; otherwise just say whose video it is.
              if (clip.creator && clip.creator.id === clip.submitted_by) {
                return (
                  <p key={`c-${clip.id}`} className="chat-line">
                    <Link href={`/u/${clip.creator.username}`} className="chat-name">
                      {clip.creator.display_name}
                    </Link>{" "}
                    shared {title}
                  </p>
                );
              }
              return (
                <p key={`c-${clip.id}`} className="chat-line">
                  New from{" "}
                  {clip.creator ? (
                    <Link href={`/u/${clip.creator.username}`} className="chat-name">
                      {clip.creator.display_name}
                    </Link>
                  ) : (
                    <span className="chat-name">{clip.channel_name}</span>
                  )}
                  : {title}
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
