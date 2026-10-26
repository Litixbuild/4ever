import Link from "next/link";
import { ArrowRightIcon, BellIcon, DiamondIcon, DotIcon } from "@/components/icons";
import { Avatar } from "@/components/people";
import { badgeInfo } from "@/lib/badges";
import { contestPhase, contestStatusLine, contestTileDate } from "@/lib/contests";
import { dateTile, formatCount } from "@/lib/format";
import type { ActivityItem, TopCreator } from "@/lib/queries";
import { RARITY_TIERS } from "@/lib/rarity";
import { site } from "@/lib/site";
import type { Contest } from "@/lib/types";

const PRIZE_COLORS = ["var(--orange)", "var(--purple)", "var(--blue)", "var(--green)"];

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
    <section aria-label="Launch week" className="launch-bar">
      <span className="pill pill-orange">
        <DotIcon size={8} color="var(--orange)" />
        {live ? "Forever is live" : "Launch week"}
      </span>
      <p>
        {live ? (
          <>World of Warcraft: Forever is live. Share your first-day moments and get featured.</>
        ) : (
          <>
            World of Warcraft: Forever goes live <strong style={{ color: "var(--text)" }}>Nov 4 at 6 PM ET</strong>.
            Share your first-day moments and get featured.
          </>
        )}
      </p>
      <Link href="/submit" className="row" style={{ gap: 6, minHeight: 44, fontWeight: 700, textDecoration: "none" }}>
        Share a launch clip <ArrowRightIcon />
      </Link>
    </section>
  );
}

export function ContestCard({ contest, compact = false }: { contest: Contest; compact?: boolean }) {
  const tile = dateTile(contestTileDate(contest));
  const phase = contestPhase(contest);
  return (
    <section aria-labelledby={`contest-${contest.id}`} className="card-contest stack">
      <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
        <span className="date-tile" aria-hidden="true">
          <span className="m">{tile.month}</span>
          <span className="d">{tile.day}</span>
        </span>
        <div className="stack-sm" style={{ gap: 2, minWidth: 0 }}>
          <span className="eyebrow eyebrow-orange" style={{ fontSize: 11.5 }}>
            {phase === "open" ? "Contest · open now" : phase === "voting" ? "Contest · voting" : "Contest"}
          </span>
          <h2 id={`contest-${contest.id}`} className="h2" style={{ fontSize: 25 }}>
            {contest.title}
          </h2>
        </div>
      </div>
      {contest.tagline ? (
        <p className="muted" style={{ margin: 0, color: "var(--text-3)" }}>
          {contest.tagline}
        </p>
      ) : null}
      <p className="small" style={{ margin: 0, color: "var(--text-2)" }}>
        {contestStatusLine(contest)}
      </p>
      {!compact && contest.prizes.length > 0 ? (
        <ul className="diamond-list">
          {contest.prizes.map((prize, i) => (
            <li key={prize}>
              <DiamondIcon color={PRIZE_COLORS[i % PRIZE_COLORS.length]} />
              {prize}
            </li>
          ))}
        </ul>
      ) : null}
      <Link href={`/contests/${contest.slug}`} className="btn btn-outline-gold btn-block">
        {phase === "upcoming" ? (
          <>
            <BellIcon /> See the details
          </>
        ) : phase === "open" ? (
          "Enter or vote"
        ) : (
          "See the entries"
        )}
      </Link>
    </section>
  );
}

export function TopCreatorsCard({ creators }: { creators: TopCreator[] }) {
  return (
    <section aria-labelledby="top-creators" className="card stack-sm" style={{ gap: 10 }}>
      <div className="row-between" style={{ alignItems: "baseline" }}>
        <h2 id="top-creators" className="h3">
          Top creators
        </h2>
        <span className="small muted">This week</span>
      </div>
      {creators.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>
          Nobody yet. Votes on verified creators&apos; videos put them here.
        </p>
      ) : (
        <ol className="list-plain ranked">
          {creators.map((creator, i) => (
            <li key={creator.id}>
              <span style={{ width: 18, fontSize: 13, fontWeight: 800, color: i === 0 ? "var(--gold-hi)" : "var(--faint)" }}>
                {i + 1}
              </span>
              <Avatar name={creator.display_name} src={creator.avatar_url} size={34} />
              <Link
                href={`/u/${creator.username}`}
                style={{ flex: 1, color: "var(--text)", textDecoration: "none", fontWeight: 700, minWidth: 0 }}
              >
                {creator.display_name}
              </Link>
              <span className="small muted" style={{ fontWeight: 700 }}>
                {formatCount(creator.votes)} votes
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section aria-labelledby="general-chat" className="card-sunken stack-sm" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 8 }}>
        <DotIcon size={8} color="var(--green)" />
        <h2 id="general-chat" className="h3">
          General
        </h2>
        <span className="tiny faint" style={{ marginLeft: "auto" }}>
          Community activity
        </span>
      </div>
      {items.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>
          Quiet in here. Be the first to share something.
        </p>
      ) : (
        <div className="feed">
          {items.map((item) => {
            if (item.type === "clip") {
              return (
                <p key={`c-${item.clip.id}`}>
                  <span className="chan chan-new">[New]</span>{" "}
                  <Link href={`/c/${item.clip.short_id}`}>{item.clip.title}</Link> by{" "}
                  {item.clip.creator?.display_name ?? item.clip.channel_name}
                </p>
              );
            }
            if (item.type === "badge") {
              const badge = badgeInfo(item.badge);
              return (
                <p key={`b-${item.person.username}-${item.badge}`} className="achievement-line">
                  <Link href={`/u/${item.person.username}`}>{item.person.display_name}</Link> has earned the
                  achievement [{badge?.name ?? "Achievement"}]!
                </p>
              );
            }
            return (
              <p key={`k-${item.contest.id}`}>
                <span className="chan chan-contest">[Contest]</span>{" "}
                <Link href={`/contests/${item.contest.slug}`}>{item.contest.title}</Link> is open. Start recording.
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function CreatorsBand() {
  return (
    <section aria-labelledby="creators-band" className="band">
      <div className="stack" style={{ flex: "1 1 380px", gap: 12 }}>
        <span className="eyebrow">For creators</span>
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
      <ol className="steps">
        <li>
          <span className="numeral">I</span>
          <strong>Paste a link</strong>
          <span className="small muted">YouTube or Twitch. Nothing to upload.</span>
        </li>
        <li>
          <span className="numeral">II</span>
          <strong>Get the credit</strong>
          <span className="small muted">We read the real channel from YouTube or Twitch, so credit can&apos;t be faked.</span>
        </li>
        <li>
          <span className="numeral">III</span>
          <strong>Get featured</strong>
          <span className="small muted">Earn titles, climb the Hall of Fame, win contests.</span>
        </li>
      </ol>
    </section>
  );
}

// A quiet key for the title colors. Shows numbers only, never tier names.
export function RarityLegend() {
  const tiers = [...RARITY_TIERS].reverse();
  return (
    <p className="row tiny muted" style={{ gap: "6px 14px", margin: 0 }}>
      <span>Title color = views on 4Ever:</span>
      {tiers.map((tier) => (
        <span key={tier.key} className="row" style={{ gap: 6 }}>
          <DotIcon size={8} color={tier.color} />
          {tier.minViews === 0 ? "New" : `${formatCount(tier.minViews)}+`}
        </span>
      ))}
    </p>
  );
}
