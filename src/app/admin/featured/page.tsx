import Link from "next/link";
import { endFeature, setFeature } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { formatDate } from "@/lib/format";
import { requireCurator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMostViewed } from "@/lib/queries";

type FeatureRow = {
  id: string;
  use_text: string | null;
  flavor_text: string | null;
  starts_at: string;
  ends_at: string | null;
  clip: { short_id: string; title: string } | null;
};

function currentFeature(features: FeatureRow[], now = Date.now()) {
  return features.find(
    (f) => new Date(f.starts_at).getTime() <= now && (!f.ends_at || new Date(f.ends_at).getTime() > now),
  );
}

export default async function FeaturedAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  await requireCurator();
  const { notice } = await searchParams;
  const admin = createAdminClient();
  const [{ data }, popular] = await Promise.all([
    admin
      .from("features")
      .select("id, use_text, flavor_text, starts_at, ends_at, clip:clips ( short_id, title )")
      .order("starts_at", { ascending: false })
      .limit(20),
    getMostViewed(8),
  ]);
  const features = (data ?? []) as unknown as FeatureRow[];
  const current = currentFeature(features);

  return (
    <div className="stack-lg">
      <AdminNotice notice={notice} />

      <section className="card stack" aria-labelledby="current">
        <h2 id="current" className="h3">
          On the front page now
        </h2>
        {current?.clip ? (
          <div className="row-between" style={{ alignItems: "center" }}>
            <span>
              <Link href={`/c/${current.clip.short_id}`} style={{ fontWeight: 800 }}>
                {current.clip.title}
              </Link>{" "}
              <span className="small muted">until {current.ends_at ? formatDate(current.ends_at) : "replaced"}</span>
            </span>
            <form action={endFeature}>
              <input type="hidden" name="featureId" value={current.id} />
              <input type="hidden" name="returnTo" value="/admin/featured" />
              <button type="submit" className="btn btn-ghost btn-sm">
                End now
              </button>
            </form>
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            Nothing featured. The front page shows the most watched video of the week instead.
          </p>
        )}
      </section>

      <form action={setFeature} className="form-card" aria-labelledby="new-feature">
        <h2 id="new-feature" className="h3">
          Pick a new Movie of the Week
        </h2>
        <input type="hidden" name="returnTo" value="/admin/featured" />
        <div className="field">
          <label htmlFor="feature-clip" className="label">
            Video
          </label>
          <input id="feature-clip" name="clip" className="input" required placeholder="https://4everclips.com/c/k3J9xP2a or k3J9xP2a" />
          <p className="help">
            Popular right now:{" "}
            {popular.slice(0, 5).map((c, i) => (
              <span key={c.id}>
                {i > 0 ? ", " : ""}
                <code>{c.short_id}</code> {c.title}
              </span>
            ))}
          </p>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="use_text" className="label">
              &ldquo;Use:&rdquo; line <span className="optional">(optional)</span>
            </label>
            <input id="use_text" name="use_text" className="input" maxLength={120} placeholder="Relive the Southshore wars, one ambush at a time." />
          </div>
          <div className="field">
            <label htmlFor="flavor_text" className="label">
              Flavor text <span className="optional">(optional)</span>
            </label>
            <input id="flavor_text" name="flavor_text" className="input" maxLength={120} placeholder="Every ganker has a story." />
          </div>
          <div className="field">
            <label htmlFor="days" className="label">
              Days on the front page
            </label>
            <input id="days" name="days" type="number" min={1} max={30} defaultValue={7} className="input" />
          </div>
        </div>
        <button type="submit" className="btn btn-gold btn-lg" style={{ alignSelf: "flex-start" }}>
          Feature it
        </button>
        <p className="help">The creator earns the Movie of the Week achievement if their channel is verified.</p>
      </form>

      {features.length > 0 ? (
        <section aria-labelledby="history" className="stack">
          <h2 id="history" className="h3">
            History
          </h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>From</th>
                  <th>To</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.id}>
                    <td>{f.clip ? <Link href={`/c/${f.clip.short_id}`}>{f.clip.title}</Link> : "Deleted video"}</td>
                    <td>{formatDate(f.starts_at)}</td>
                    <td>{f.ends_at ? formatDate(f.ends_at) : "Open"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
