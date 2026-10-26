import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withdrawEntry } from "@/app/contests/actions";
import { ClipCard } from "@/components/clip-card";
import { EnterContestForm } from "@/components/enter-contest";
import { DiamondIcon, TrophyIcon, UpIcon } from "@/components/icons";
import { getViewer } from "@/lib/auth";
import { contestPhase, contestStatusLine } from "@/lib/contests";
import { formatCount, formatDateTime } from "@/lib/format";
import { getClipsByCreator, getContest, getContestStandings } from "@/lib/queries";

type Params = { params: Promise<{ slug: string }> };

const PLACE_COLORS: Record<number, string> = { 1: "#f2cf7e", 2: "#d6dbe4", 3: "#d9935a" };
const PLACE_NAMES: Record<number, string> = { 1: "Champion", 2: "Second place", 3: "Third place" };
const PRIZE_COLORS = ["var(--orange)", "var(--purple)", "var(--blue)", "var(--green)"];

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const contest = await getContest(slug);
  return contest ? { title: contest.title, description: contest.tagline ?? undefined } : { title: "Not found" };
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
  const hasWinners = standings.some((s) => s.placement);

  return (
    <div className="container page" style={{ gap: 32 }}>
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow eyebrow-orange">
          {phase === "open" ? "Contest · open now" : phase === "voting" ? "Contest · voting" : phase === "upcoming" ? "Contest · coming up" : "Contest · finished"}
        </span>
        <h1 className="h1">{contest.title}</h1>
        {contest.tagline ? <p className="lead">{contest.tagline}</p> : null}
        <div className="chips" style={{ marginTop: 4 }}>
          <span className="pill pill-muted">Opens {formatDateTime(contest.opens_at)}</span>
          <span className="pill pill-muted">Entries close {formatDateTime(contest.closes_at)}</span>
          <span className="pill pill-muted">Voting ends {formatDateTime(contest.ends_at)}</span>
        </div>
      </div>

      <div className="split">
        <div className="split-main stack-lg">
          {contest.description ? <p className="prose pre-line" style={{ margin: 0 }}>{contest.description}</p> : null}

          <section aria-labelledby="entries" className="stack" style={{ gap: 16 }}>
            <div className="row-between">
              <h2 id="entries" className="h2">
                {hasWinners ? "Results" : "Entries"}
              </h2>
              <span className="small muted">
                {standings.length === 1 ? "1 entry" : `${standings.length} entries`} · ranked by votes cast during the contest
              </span>
            </div>
            {standings.length > 0 ? (
              <div className="clip-grid">
                {standings.map((s, i) => (
                  <div key={s.clip.id} className="stack-sm" style={{ gap: 8 }}>
                    <div className="row" style={{ gap: 8 }}>
                      {s.placement ? (
                        <span className="pill" style={{ color: PLACE_COLORS[s.placement], border: `1px solid ${PLACE_COLORS[s.placement]}55`, background: "var(--surface)" }}>
                          <TrophyIcon size={13} /> {PLACE_NAMES[s.placement]}
                        </span>
                      ) : (
                        <span className="pill pill-muted">#{i + 1}</span>
                      )}
                      <span className="icon-stat small" style={{ color: "var(--gold-hi)" }}>
                        <UpIcon size={13} /> {formatCount(s.windowVotes)} contest votes
                      </span>
                    </div>
                    <ClipCard clip={s.clip} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <p className="muted" style={{ margin: 0 }}>
                  {phase === "upcoming" ? "Entries open soon." : "No entries yet."}
                </p>
              </div>
            )}
          </section>

          {contest.rules ? (
            <section aria-labelledby="rules" className="stack" style={{ gap: 10 }}>
              <h2 id="rules" className="h2" style={{ fontSize: 22 }}>
                Rules
              </h2>
              <p className="prose pre-line" style={{ margin: 0 }}>{contest.rules}</p>
            </section>
          ) : null}
        </div>

        <aside className="split-aside">
          <section aria-labelledby="enter" className="card-contest stack">
            <h2 id="enter" className="h3">
              {phase === "open" ? "Enter" : "Status"}
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
                  Entries have to come from your own verified channel. <Link href="/settings#channels">Verify a channel</Link>,
                  then <Link href="/submit">submit your video</Link>. Once it&apos;s approved you can enter it here.
                </p>
              )
            ) : null}
          </section>

          {contest.prizes.length > 0 ? (
            <section aria-labelledby="prizes" className="card stack" style={{ gap: 12 }}>
              <h2 id="prizes" className="h3">
                Prizes
              </h2>
              <ul className="diamond-list">
                {contest.prizes.map((prize, i) => (
                  <li key={prize}>
                    <DiamondIcon color={PRIZE_COLORS[i % PRIZE_COLORS.length]} />
                    {prize}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
