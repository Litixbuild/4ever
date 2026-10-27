import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withdrawEntry } from "@/app/contests/actions";
import { ClipCard } from "@/components/clip-card";
import { EnterContestForm } from "@/components/enter-contest";
import { TrophyIcon, UpIcon, VideoIcon } from "@/components/icons";
import { ContestTimeline, PhaseBadge, PrizeList } from "@/components/widgets";
import { getViewer } from "@/lib/auth";
import { contestPhase, contestStatusLine } from "@/lib/contests";
import { formatCount, formatDate } from "@/lib/format";
import { getClipsByCreator, getContest, getContestStandings, type ContestStanding } from "@/lib/queries";

type Params = { params: Promise<{ slug: string }> };

const PLACE_NAMES: Record<number, string> = { 1: "Champion", 2: "Second place", 3: "Third place" };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const contest = await getContest(slug);
  return contest ? { title: contest.title, description: contest.tagline ?? undefined } : { title: "Not found" };
}

function Entry({ standing, rank }: { standing: ContestStanding; rank: number }) {
  const place = standing.placement;
  return (
    <div className={`entry ${place ? `place-${place}` : ""}`}>
      <div className="entry-head">
        {place ? (
          <span className="entry-place">
            <TrophyIcon size={14} /> {PLACE_NAMES[place]}
          </span>
        ) : (
          <span className="entry-rank">#{rank}</span>
        )}
        <span className="entry-votes">
          <UpIcon size={13} /> {formatCount(standing.windowVotes)} {standing.windowVotes === 1 ? "vote" : "votes"}
        </span>
      </div>
      <ClipCard clip={standing.clip} />
    </div>
  );
}

export default async function ContestPage({ params }: Params) {
  const { slug } = await params;
  const contest = await getContest(slug);
  if (!contest) notFound();

  const viewer = await getViewer();
  const phase = contestPhase(contest);
  const [standings, myClips] = await Promise.all([
    getContestStandings(contest.id),
    viewer && phase === "open" ? getClipsByCreator(viewer.userId, 60) : Promise.resolve([]),
  ]);

  const myEntry = viewer ? standings.find((s) => s.clip.creator_id === viewer.userId) : undefined;
  const enteredIds = new Set(standings.map((s) => s.clip.id));
  const eligible = myClips.filter((c) => !enteredIds.has(c.id));
  const winners = standings.filter((s) => s.placement).sort((a, b) => (a.placement ?? 9) - (b.placement ?? 9));
  const others = standings.filter((s) => !s.placement);

  return (
    <div className="container page" style={{ gap: 32 }}>
      <div className="page-head">
        <PhaseBadge phase={phase} />
        <h1 className="h1">{contest.title}</h1>
        {contest.tagline ? <p className="lead">{contest.tagline}</p> : null}
      </div>

      <ContestTimeline contest={contest} />

      <div className={phase === "open" || phase === "upcoming" ? "split split-contest" : "split"}>
        <div className="split-main stack-lg" style={{ gap: 32 }}>
          {contest.description ? (
            <p className="prose pre-line" style={{ margin: 0 }}>
              {contest.description}
            </p>
          ) : null}

          {winners.length > 0 ? (
            <section aria-labelledby="results" className="stack" style={{ gap: 18 }}>
              <h2 id="results" className="h2">
                Results
              </h2>
              <div className="podium">
                {winners.map((s) => (
                  <Entry key={s.clip.id} standing={s} rank={s.placement ?? 0} />
                ))}
              </div>
            </section>
          ) : null}

          {winners.length > 0 && others.length === 0 ? null : (
            <section aria-labelledby="entries" className="stack" style={{ gap: 18 }}>
              <div className="row-between" style={{ alignItems: "baseline" }}>
                <h2 id="entries" className="h2">
                  {winners.length > 0 ? "Every other entry" : "Entries"}
                </h2>
                {standings.length > 0 ? (
                  <span className="small muted">
                    {standings.length === 1 ? "1 entry" : `${standings.length} entries`}, ranked by votes cast during
                    the contest
                  </span>
                ) : null}
              </div>
              {others.length > 0 ? (
                <div className="clip-grid">
                  {others.map((s) => (
                    <Entry key={s.clip.id} standing={s} rank={standings.indexOf(s) + 1} />
                  ))}
                </div>
              ) : (
                <div className="slot">
                  <span className="slot-icon">
                    <VideoIcon size={26} />
                  </span>
                  <span className="stack-sm" style={{ gap: 4 }}>
                    <strong>
                      {phase === "upcoming"
                        ? `Entries open ${formatDate(contest.opens_at)}`
                        : winners.length > 0
                          ? "Only the winners entered this one"
                          : phase === "open"
                            ? "No entries yet"
                            : "Nobody entered this one"}
                    </strong>
                    <span className="muted small">
                      {phase === "upcoming" || phase === "open"
                        ? "Start recording. Entries come from your own verified channel, one per person."
                        : "Keep an eye on the contests page for the next one."}
                    </span>
                  </span>
                </div>
              )}
            </section>
          )}

          {contest.rules ? (
            <section aria-labelledby="rules" className="stack" style={{ gap: 10 }}>
              <h2 id="rules" className="h-gold" style={{ fontSize: 22 }}>
                Rules
              </h2>
              <p className="prose pre-line" style={{ margin: 0 }}>
                {contest.rules}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="split-aside">
          <section aria-labelledby="enter" className="card-contest stack">
            <h2 id="enter" className="h-gold">
              {phase === "open" ? "Enter this contest" : "Status"}
            </h2>
            <p className="small" style={{ margin: 0, color: "var(--text-2)" }}>
              {contestStatusLine(contest)}
            </p>
            {phase === "open" ? (
              !viewer ? (
                <Link href={`/login?next=${encodeURIComponent(`/contests/${contest.slug}`)}`} className="btn btn-gold">
                  Log in to enter
                </Link>
              ) : myEntry ? (
                <div className="stack-sm">
                  <p className="small" style={{ margin: 0 }}>
                    Your entry: <strong>{myEntry.clip.title}</strong>
                  </p>
                  <form action={withdrawEntry}>
                    <input type="hidden" name="contestId" value={contest.id} />
                    <input type="hidden" name="clipId" value={myEntry.clip.id} />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      Withdraw to swap entries
                    </button>
                  </form>
                </div>
              ) : eligible.length > 0 ? (
                <EnterContestForm contestId={contest.id} clips={eligible.map((c) => ({ id: c.id, title: c.title }))} />
              ) : (
                <p className="small muted" style={{ margin: 0 }}>
                  Entries have to come from your own verified channel.{" "}
                  <Link href="/settings#channels">Verify a channel</Link>, then{" "}
                  <Link href="/submit">submit your video</Link>. Once it&apos;s approved you can enter it here.
                </p>
              )
            ) : null}
          </section>

          {contest.prizes.length > 0 ? (
            <section aria-labelledby="prizes" className="card stack" style={{ gap: 12 }}>
              <h2 id="prizes" className="h-gold">
                Prizes
              </h2>
              <PrizeList prizes={contest.prizes} />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
