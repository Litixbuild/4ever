import type { Metadata } from "next";
import Link from "next/link";
import { ClipCard, ClipGrid } from "@/components/clip-card";
import { StarIcon, TrophyIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { getChampions, getMostViewed, listFeatures } from "@/lib/queries";

export const metadata: Metadata = { title: "Hall of Fame" };

export default async function HallOfFamePage() {
  const [features, champions, mostViewed] = await Promise.all([listFeatures(24), getChampions(24), getMostViewed(12)]);

  return (
    <div className="container page" style={{ gap: 48 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Hall of Fame</span>
        <h1 className="h1">The legends of 4Ever</h1>
        <p className="lead">Every Movie of the Week, every contest champion, and the most watched videos of all time.</p>
      </div>

      <section aria-labelledby="champions" className="stack" style={{ gap: 16 }}>
        <h2 id="champions" className="h2 row" style={{ gap: 10 }}>
          <TrophyIcon size={22} style={{ color: "var(--gold-hi)" }} /> Contest champions
        </h2>
        {champions.length > 0 ? (
          <div className="clip-grid">
            {champions.map(({ contest, clip }) => (
              <div key={`${contest.id}-${clip.id}`} className="stack-sm" style={{ gap: 8 }}>
                <Link href={`/contests/${contest.slug}`} className="pill pill-gold" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
                  {contest.title}
                </Link>
                <ClipCard clip={clip} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p className="muted" style={{ margin: 0 }}>
              No champions crowned yet. <Link href="/contests">See the contests</Link>
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="motw" className="stack" style={{ gap: 16 }}>
        <h2 id="motw" className="h2 row" style={{ gap: 10 }}>
          <StarIcon size={20} style={{ color: "var(--orange)" }} /> Movies of the Week
        </h2>
        {features.length > 0 ? (
          <div className="clip-grid">
            {features.map((feature) => (
              <div key={feature.id} className="stack-sm" style={{ gap: 8 }}>
                <span className="pill pill-orange" style={{ alignSelf: "flex-start" }}>
                  Week of {formatDate(feature.starts_at)}
                </span>
                {feature.clip ? <ClipCard clip={feature.clip} /> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p className="muted" style={{ margin: 0 }}>
              The first Movie of the Week is picked soon after launch.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="most-watched" className="stack" style={{ gap: 16 }}>
        <h2 id="most-watched" className="h2">
          Most watched of all time
        </h2>
        {mostViewed.length > 0 ? (
          <ClipGrid clips={mostViewed} />
        ) : (
          <div className="empty">
            <p className="muted" style={{ margin: 0 }}>
              Nothing here yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
