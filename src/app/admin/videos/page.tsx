import Link from "next/link";
import { setClipStatus, updateClip } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { requireCurator } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { cleanSearch, formatCount, timeAgo } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLIP_COLUMNS, type Clip } from "@/lib/types";

const STATUSES = ["all", "approved", "pending", "rejected", "removed"] as const;

export default async function VideosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; q?: string; status?: string }>;
}) {
  await requireCurator();
  const { notice, q: rawQ, status: rawStatus } = await searchParams;
  const q = cleanSearch(rawQ);
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number]) ? rawStatus : "all";

  const admin = createAdminClient();
  let query = admin.from("clips").select(CLIP_COLUMNS).order("created_at", { ascending: false }).limit(50);
  if (status !== "all") query = query.eq("status", status);
  if (q) query = /^[A-Za-z0-9]{8}$/.test(q) ? query.or(`short_id.eq.${q},title.ilike."%${q}%"`) : query.or(`title.ilike."%${q}%",channel_name.ilike."%${q}%"`);
  const { data } = await query;
  const clips = (data ?? []) as unknown as Clip[];

  return (
    <div className="stack-lg">
      <AdminNotice notice={notice} />
      <form action="/admin/videos" method="get" className="row" role="search">
        <label htmlFor="video-search" className="sr-only">
          Search videos
        </label>
        <input id="video-search" name="q" className="input" defaultValue={q} placeholder="Title, channel or short id" style={{ flex: "1 1 280px", width: "auto" }} />
        <label htmlFor="video-status" className="sr-only">
          Status
        </label>
        <select id="video-status" name="status" className="select" defaultValue={status} style={{ width: 160 }}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Any status" : s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ghost">
          Search
        </button>
      </form>

      {clips.length === 0 ? <p className="muted">No videos match.</p> : null}

      <div className="stack">
        {clips.map((clip) => (
          <article key={clip.id} className="card stack" style={{ gap: 10, padding: 18 }}>
            <div className="row-between" style={{ alignItems: "center" }}>
              <div className="stack-sm" style={{ gap: 2, minWidth: 0 }}>
                <Link href={`/c/${clip.short_id}`} style={{ fontWeight: 800 }}>
                  {clip.title}
                </Link>
                <span className="tiny muted">
                  {clip.short_id} · {clip.channel_name} · {formatCount(clip.view_count)} views · {formatCount(clip.vote_count)} votes ·
                  added {timeAgo(clip.created_at)}
                </span>
              </div>
              <span className={`pill ${clip.status === "approved" ? "pill-green" : clip.status === "pending" ? "pill-gold" : "pill-red"}`}>
                {clip.status}
              </span>
            </div>
            <details>
              <summary className="small" style={{ cursor: "pointer", fontWeight: 700, color: "var(--text-3)" }}>
                Edit
              </summary>
              <form action={updateClip} className="stack" style={{ marginTop: 12, gap: 12 }}>
                <input type="hidden" name="clipId" value={clip.id} />
                <input type="hidden" name="returnTo" value="/admin/videos" />
                <div className="field">
                  <label htmlFor={`t-${clip.id}`} className="label" style={{ fontSize: 14 }}>
                    Title
                  </label>
                  <input id={`t-${clip.id}`} name="title" className="input" defaultValue={clip.title} maxLength={140} required />
                </div>
                <div className="field-grid">
                  <div className="field">
                    <label htmlFor={`k-${clip.id}`} className="label" style={{ fontSize: 14 }}>
                      Type
                    </label>
                    <select id={`k-${clip.id}`} name="kind" className="select" defaultValue={clip.kind}>
                      <option value="movie">Movie</option>
                      <option value="clip">Clip</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`c-${clip.id}`} className="label" style={{ fontSize: 14 }}>
                      Category
                    </label>
                    <select id={`c-${clip.id}`} name="category" className="select" defaultValue={clip.category}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`g-${clip.id}`} className="label" style={{ fontSize: 14 }}>
                      Tags
                    </label>
                    <input id={`g-${clip.id}`} name="tags" className="input" defaultValue={clip.tags.join(", ")} />
                  </div>
                </div>
                <button type="submit" className="btn btn-gold btn-sm" style={{ alignSelf: "flex-start" }}>
                  Save changes
                </button>
              </form>
            </details>
            <div className="row">
              {clip.status !== "removed" ? (
                <form action={setClipStatus} className="row" style={{ gap: 8 }}>
                  <input type="hidden" name="clipId" value={clip.id} />
                  <input type="hidden" name="status" value="removed" />
                  <input type="hidden" name="returnTo" value="/admin/videos" />
                  <label className="sr-only" htmlFor={`n-${clip.id}`}>
                    Reason
                  </label>
                  <input id={`n-${clip.id}`} name="note" className="input" placeholder="Reason (optional)" style={{ minHeight: 36, width: 220 }} />
                  <button type="submit" className="btn btn-danger btn-sm">
                    Remove
                  </button>
                </form>
              ) : null}
              {clip.status !== "approved" ? (
                <form action={setClipStatus}>
                  <input type="hidden" name="clipId" value={clip.id} />
                  <input type="hidden" name="status" value="approved" />
                  <input type="hidden" name="returnTo" value="/admin/videos" />
                  <button type="submit" className="btn btn-ghost btn-sm">
                    {clip.status === "removed" ? "Restore" : "Approve"}
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
