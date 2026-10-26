import Link from "next/link";
import { saveContest, setPlacement } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { contestPhase } from "@/lib/contests";
import { formatCount } from "@/lib/format";
import { requireCurator } from "@/lib/auth";
import { getContestStandings, listContests } from "@/lib/queries";
import { isoToLocalInput } from "@/lib/time";
import type { Contest } from "@/lib/types";

function ContestFields({ contest }: { contest?: Contest }) {
  const key = contest?.id ?? "new";
  return (
    <>
      <input type="hidden" name="returnTo" value="/admin/contests" />
      {contest ? <input type="hidden" name="contestId" value={contest.id} /> : null}
      <div className="field-grid">
        <div className="field">
          <label htmlFor={`title-${key}`} className="label">
            Title
          </label>
          <input id={`title-${key}`} name="title" className="input" defaultValue={contest?.title} maxLength={80} required />
        </div>
        <div className="field">
          <label htmlFor={`slug-${key}`} className="label">
            Link name
          </label>
          <input id={`slug-${key}`} name="slug" className="input" defaultValue={contest?.slug} pattern="[a-z0-9\-]{3,60}" required placeholder="first-kill" />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`tagline-${key}`} className="label">
          Tagline
        </label>
        <input id={`tagline-${key}`} name="tagline" className="input" defaultValue={contest?.tagline ?? ""} maxLength={160} />
      </div>
      <div className="field">
        <label htmlFor={`description-${key}`} className="label">
          Description
        </label>
        <textarea id={`description-${key}`} name="description" className="textarea" defaultValue={contest?.description ?? ""} rows={3} />
      </div>
      <div className="field">
        <label htmlFor={`rules-${key}`} className="label">
          Rules
        </label>
        <textarea id={`rules-${key}`} name="rules" className="textarea" defaultValue={contest?.rules ?? ""} rows={4} />
      </div>
      <div className="field">
        <label htmlFor={`prizes-${key}`} className="label">
          Prizes <span className="optional">(one per line)</span>
        </label>
        <textarea id={`prizes-${key}`} name="prizes" className="textarea" defaultValue={contest?.prizes.join("\n") ?? ""} rows={3} />
        <p className="help">Blizzard&apos;s video policy requires a license if the total value of all prizes is over $500.</p>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor={`opens-${key}`} className="label">
            Opens (ET)
          </label>
          <input id={`opens-${key}`} name="opens_at" type="datetime-local" className="input" defaultValue={contest ? isoToLocalInput(contest.opens_at) : ""} required />
        </div>
        <div className="field">
          <label htmlFor={`closes-${key}`} className="label">
            Entries close (ET)
          </label>
          <input id={`closes-${key}`} name="closes_at" type="datetime-local" className="input" defaultValue={contest ? isoToLocalInput(contest.closes_at) : ""} required />
        </div>
        <div className="field">
          <label htmlFor={`ends-${key}`} className="label">
            Voting ends (ET)
          </label>
          <input id={`ends-${key}`} name="ends_at" type="datetime-local" className="input" defaultValue={contest ? isoToLocalInput(contest.ends_at) : ""} required />
        </div>
      </div>
    </>
  );
}

export default async function ContestsAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await requireCurator();
  const { notice } = await searchParams;
  const contests = await listContests();
  const standings = await Promise.all(contests.map((c) => getContestStandings(c.id)));

  return (
    <div className="stack-lg">
      <AdminNotice notice={notice} />

      {contests.map((contest, index) => {
        const entries = standings[index];
        const phase = contestPhase(contest);
        return (
          <section key={contest.id} className="card stack" aria-labelledby={`c-${contest.id}`} style={{ gap: 16 }}>
            <div className="row-between" style={{ alignItems: "center" }}>
              <h2 id={`c-${contest.id}`} className="h3" style={{ fontSize: 18 }}>
                <Link href={`/contests/${contest.slug}`}>{contest.title}</Link>
              </h2>
              <span className="pill pill-muted">{phase}</span>
            </div>

            {entries.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Entry</th>
                      <th>Contest votes</th>
                      <th>Placement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.clip.id}>
                        <td>
                          <Link href={`/c/${entry.clip.short_id}`}>{entry.clip.title}</Link>
                          <div className="tiny muted">{entry.clip.creator?.display_name ?? entry.clip.channel_name}</div>
                        </td>
                        <td>{formatCount(entry.windowVotes)}</td>
                        <td>
                          <form action={setPlacement} className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                            <input type="hidden" name="contestId" value={contest.id} />
                            <input type="hidden" name="clipId" value={entry.clip.id} />
                            <input type="hidden" name="returnTo" value="/admin/contests" />
                            <label className="sr-only" htmlFor={`place-${contest.id}-${entry.clip.id}`}>
                              Placement
                            </label>
                            <select
                              id={`place-${contest.id}-${entry.clip.id}`}
                              name="placement"
                              className="select"
                              defaultValue={entry.placement ? String(entry.placement) : ""}
                              style={{ minHeight: 38, width: 120 }}
                            >
                              <option value="">None</option>
                              <option value="1">Champion</option>
                              <option value="2">Second</option>
                              <option value="3">Third</option>
                            </select>
                            <button type="submit" className="btn btn-ghost btn-sm">
                              Save
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="small muted" style={{ margin: 0 }}>
                No entries yet.
              </p>
            )}

            <details>
              <summary className="small" style={{ cursor: "pointer", fontWeight: 700, color: "var(--text-3)" }}>
                Edit details and dates
              </summary>
              <form action={saveContest} className="stack" style={{ marginTop: 16 }}>
                <ContestFields contest={contest} />
                <button type="submit" className="btn btn-gold" style={{ alignSelf: "flex-start" }}>
                  Save contest
                </button>
              </form>
            </details>
          </section>
        );
      })}

      <section className="stack" aria-labelledby="new-contest">
        <h2 id="new-contest" className="h3" style={{ fontSize: 18 }}>
          Create a contest
        </h2>
        <form action={saveContest} className="form-card">
          <ContestFields />
          <button type="submit" className="btn btn-gold btn-lg" style={{ alignSelf: "flex-start" }}>
            Create contest
          </button>
        </form>
      </section>
    </div>
  );
}
