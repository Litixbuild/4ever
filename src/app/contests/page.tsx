import type { Metadata } from "next";
import { ContestCard } from "@/components/widgets";
import { contestPhase } from "@/lib/contests";
import { listContests } from "@/lib/queries";

export const metadata: Metadata = { title: "Contests" };

export default async function ContestsPage() {
  const contests = await listContests();
  const live = contests.filter((c) => ["open", "voting"].includes(contestPhase(c)));
  const upcoming = contests.filter((c) => contestPhase(c) === "upcoming").reverse();
  const past = contests.filter((c) => contestPhase(c) === "ended");

  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 } as const;

  return (
    <div className="container page" style={{ gap: 40 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Contests</span>
        <h1 className="h1">Prove it on film</h1>
        <p className="lead">
          Enter a movie or clip from your own verified channel. The community votes while a contest is open, and curators
          pick the winners. Winners get the front page, the Hall of Fame, and a title to show off.
        </p>
      </div>

      {live.length > 0 ? (
        <section aria-labelledby="live" className="stack" style={{ gap: 16 }}>
          <h2 id="live" className="h2">
            Happening now
          </h2>
          <div style={grid}>
            {live.map((c) => (
              <ContestCard key={c.id} contest={c} />
            ))}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-labelledby="upcoming" className="stack" style={{ gap: 16 }}>
          <h2 id="upcoming" className="h2">
            Coming up
          </h2>
          <div style={grid}>
            {upcoming.map((c) => (
              <ContestCard key={c.id} contest={c} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section aria-labelledby="past" className="stack" style={{ gap: 16 }}>
          <h2 id="past" className="h2">
            Past contests
          </h2>
          <div style={grid}>
            {past.map((c) => (
              <ContestCard key={c.id} contest={c} compact />
            ))}
          </div>
        </section>
      ) : null}

      {contests.length === 0 ? (
        <div className="empty">
          <h2 className="h3">No contests yet</h2>
          <p className="muted" style={{ margin: 0 }}>
            The first one is on its way. Start recording.
          </p>
        </div>
      ) : null}
    </div>
  );
}
