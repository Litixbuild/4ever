import type { Metadata } from "next";
import Link from "next/link";
import { ClipCard, ClipGrid } from "@/components/clip-card";
import { EyeIcon, StarIcon, TrophyIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { getMostViewed, listFeatures } from "@/lib/queries";

export const metadata: Metadata = { title: "Hall of Fame" };

export default async function HallOfFamePage() {
  const [features, mostViewed] = await Promise.all([listFeatures(24), getMostViewed(12)]);

  return (
    <div className="container page" style={{ gap: 52 }}>
      <div className="page-head">
        <h1 className="h1">Hall of Fame</h1>
        <p className="lead">Every Movie of the Week and the most watched videos of all time.</p>
      </div>

      <section aria-labelledby="motw" className="stack" style={{ gap: 18 }}>
        <h2 id="motw" className="h2 row" style={{ gap: 12 }}>
          <StarIcon size={22} style={{ color: "var(--q-legendary)" }} /> Movies of the Week
        </h2>
        {features.length > 0 ? (
          <div className="clip-grid">
            {features.map((feature) =>
              feature.clip ? (
                <div key={feature.id} className="entry">
                  <span className="plaque plaque-plain">Week of {formatDate(feature.starts_at)}</span>
                  <ClipCard clip={feature.clip} />
                  {feature.use_text || feature.flavor_text ? (
                    <div className="wow-tip mini-tip">
                      {feature.use_text ? <span className="tip-use">Use: {feature.use_text}</span> : null}
                      {feature.flavor_text ? (
                        <span className="tip-flavor">&ldquo;{feature.flavor_text}&rdquo;</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <div className="slot">
            <span className="slot-icon">
              <StarIcon size={26} />
            </span>
            <span className="stack-sm" style={{ gap: 4 }}>
              <strong>Empty slot</strong>
              <span className="muted small">
                Every week curators put one video on the front page. The first pick comes right after launch.
              </span>
            </span>
          </div>
        )}
      </section>

      <section aria-labelledby="most-watched" className="stack" style={{ gap: 18 }}>
        <h2 id="most-watched" className="h2 row" style={{ gap: 12 }}>
          <EyeIcon size={22} style={{ color: "var(--q-epic)" }} /> Most watched of all time
        </h2>
        {mostViewed.length > 0 ? (
          <ClipGrid clips={mostViewed} />
        ) : (
          <div className="slot">
            <span className="slot-icon">
              <EyeIcon size={26} />
            </span>
            <span className="stack-sm" style={{ gap: 4 }}>
              <strong>Empty slot</strong>
              <span className="muted small">
                The most watched videos on 4Ever land here. <Link href="/submit">Share yours</Link>
              </span>
            </span>
          </div>
        )}
      </section>
      <section aria-labelledby="champions" className="stack" style={{ gap: 18 }}>
        <h2 id="champions" className="h2 row" style={{ gap: 12 }}>
          <TrophyIcon size={24} style={{ color: "var(--flavor)" }} /> Contest champions
        </h2>
        <div className="slot">
          <span className="slot-icon">
            <TrophyIcon size={26} />
          </span>
          <span className="stack-sm" style={{ gap: 4 }}>
            <strong>Coming soon</strong>
            <span className="muted small">Contests are coming shortly. Their winners will be honored here.</span>
          </span>
        </div>
      </section>
    </div>
  );
}
