import type { Metadata } from "next";
import Link from "next/link";
import { TrophyIcon } from "@/components/icons";
import { ContestCard, ContestTimeline, PhaseBadge, PrizeList } from "@/components/widgets";
import { contestPhase } from "@/lib/contests";
import { formatDate } from "@/lib/format";
import { getContestStandings, listContests } from "@/lib/queries";
import { rarityClass } from "@/lib/rarity";
import type { Contest } from "@/lib/types";

export const metadata: Metadata = { title: "Contests" };

// The contest running right now, given the whole width.
function FeaturedContest({ contest }: { contest: Contest }) {
  const phase = contestPhase(contest);
  return (
    <section aria-labelledby={`live-${contest.id}`} className="contest-feature">
      <img src="/backdrop/scene.webp" alt="" className="contest-feature-art" />
      <div className="contest-feature-body">
        <PhaseBadge phase={phase} />
        <h2 id={`live-${contest.id}`} className="h1">
          <Link href={`/contests/${contest.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
            {contest.title}
          </Link>
        </h2>
        {contest.tagline ? <p className="lead">{contest.tagline}</p> : null}
        <ContestTimeline contest={contest} compact />
        {contest.prizes.length > 0 ? <PrizeList prizes={contest.prizes} /> : null}
        <div className="row" style={{ marginTop: 4 }}>
          <Link href={`/contests/${contest.slug}`} className="btn btn-gold btn-lg">
            {phase === "open" ? "Enter or vote" : "Vote on the entries"}
          </Link>
          <Link href="/rules#contests" className="btn btn-ghost btn-lg">
            Contest rules
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function ContestsPage() {
  const contests = await listContests();
  const live = contests.filter((c) => ["open", "voting"].includes(contestPhase(c)));
  const upcoming = contests.filter((c) => contestPhase(c) === "upcoming").reverse();
  const past = contests.filter((c) => contestPhase(c) === "ended");
  const pastStandings = await Promise.all(past.map((c) => getContestStandings(c.id)));

  return (
    <div className="container page" style={{ gap: 44 }}>
      <div className="page-head">
        <h1 className="h1">Contests</h1>
        <p className="lead">
          Enter a movie or clip from your own verified channel. The community votes while a contest is open, and
          curators pick the winners. Winners get the front page, the Hall of Fame, and a title to show off.
        </p>
      </div>

      {live.map((c) => (
        <FeaturedContest key={c.id} contest={c} />
      ))}

      {upcoming.length > 0 ? (
        <section aria-labelledby="upcoming" className="stack" style={{ gap: 18 }}>
          <h2 id="upcoming" className="h2">
            Coming up
          </h2>
          <div className="contest-grid">
            {upcoming.map((c) => (
              <ContestCard key={c.id} contest={c} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section aria-labelledby="past" className="stack" style={{ gap: 18 }}>
          <h2 id="past" className="h2">
            Past contests
          </h2>
          <ul className="list-plain past-list">
            {past.map((c, i) => {
              const champion = pastStandings[i].find((s) => s.placement === 1);
              return (
                <li key={c.id}>
                  <span className="past-date">{formatDate(c.ends_at)}</span>
                  <span className="past-main">
                    <Link href={`/contests/${c.slug}`} className="past-title">
                      {c.title}
                    </Link>
                    {champion ? (
                      <span className="small muted row" style={{ gap: 6 }}>
                        <TrophyIcon size={13} style={{ color: "var(--gold-hi)" }} /> Champion:{" "}
                        <Link
                          href={`/c/${champion.clip.short_id}`}
                          className={rarityClass(champion.clip.view_count)}
                          style={{ textDecoration: "none", fontWeight: 700 }}
                        >
                          [{champion.clip.title}]
                        </Link>{" "}
                        by {champion.clip.creator?.display_name ?? champion.clip.channel_name}
                      </span>
                    ) : (
                      <span className="small muted">{c.tagline}</span>
                    )}
                  </span>
                  <Link href={`/contests/${c.slug}`} className="btn btn-ghost btn-sm">
                    See the results
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {contests.length === 0 ? (
        <div className="empty">
          <h2 className="h-gold">No contests yet</h2>
          <p className="muted" style={{ margin: 0 }}>
            The first one is on its way. Start recording.
          </p>
        </div>
      ) : null}
    </div>
  );
}
