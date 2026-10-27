import Link from "next/link";
import { ClipGrid } from "@/components/clip-card";
import { ChevronRightIcon, PlayIcon } from "@/components/icons";
import { EmptyHero, Hero } from "@/components/hero";
import { ActivityFeed, ContestsSoon, CreatorsBand, LaunchBar, TopCreatorsCard } from "@/components/widgets";
import { CATEGORIES, isCategory, isKind } from "@/lib/categories";
import { getActivity, getCurrentFeature, getHeroFallback, getTopCreators, listClips } from "@/lib/queries";

function homeHref(kind: string | null, cat: string | null) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (cat) params.set("cat", cat);
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#fresh`;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ kind?: string; cat?: string }> }) {
  const params = await searchParams;
  const kind = isKind(params.kind) ? params.kind : null;
  const cat = isCategory(params.cat) ? params.cat : null;

  const [feature, fresh, creators, activity] = await Promise.all([
    getCurrentFeature(),
    listClips({ kind, category: cat, perPage: 9, sort: "new" }),
    getTopCreators(7, 5),
    getActivity(6),
  ]);
  const heroClip = feature?.clip ?? (await getHeroFallback());
  // Filters only make sense once there is something to filter.
  const hasAny = fresh.total > 0 || Boolean(kind || cat);

  const browseParams = new URLSearchParams();
  if (kind) browseParams.set("kind", kind);
  if (cat) browseParams.set("cat", cat);
  const seeAll = `/browse${browseParams.toString() ? `?${browseParams}` : ""}`;

  return (
    <div className="container page">
      <div className="stack" style={{ gap: 20 }}>
        <LaunchBar />
        {heroClip ? <Hero clip={heroClip} feature={feature} /> : <EmptyHero />}
      </div>

      <div className="split">
        <section aria-labelledby="fresh-title" className="split-main stack" style={{ gap: 22 }} id="fresh">
          <div className="row-between">
            <h2 id="fresh-title" className="h2">
              Fresh from Azeroth
            </h2>
            {hasAny ? (
              <nav aria-label="Show" className="seg">
                <Link href={homeHref(null, cat)} aria-current={!kind ? "true" : undefined}>
                  All
                </Link>
                <Link href={homeHref("movie", cat)} aria-current={kind === "movie" ? "true" : undefined}>
                  Movies
                </Link>
                <Link href={homeHref("clip", cat)} aria-current={kind === "clip" ? "true" : undefined}>
                  Clips
                </Link>
              </nav>
            ) : null}
          </div>

          {hasAny ? (
            <Link href="/watch" className="feed-cta">
              <span className="feed-cta-icon">
                <PlayIcon size={20} style={{ marginLeft: 3 }} />
              </span>
              <span className="stack-sm" style={{ gap: 2 }}>
                <strong>Swipe through clips</strong>
                <span className="small muted">Full screen, one at a time.</span>
              </span>
            </Link>
          ) : null}

          {hasAny ? (
            <nav aria-label="Categories" className="chips">
              <Link href={homeHref(kind, null)} className="chip" aria-current={!cat ? "true" : undefined}>
                All categories
              </Link>
              {CATEGORIES.filter((c) => c.value !== "other").map((c) => (
                <Link
                  key={c.value}
                  href={homeHref(kind, c.value)}
                  className="chip"
                  aria-current={cat === c.value ? "true" : undefined}
                >
                  {c.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {fresh.clips.length > 0 ? (
            <>
              <ClipGrid clips={fresh.clips} />
              {fresh.total > fresh.clips.length ? (
                <Link href={seeAll} className="btn btn-ghost btn-lg" style={{ alignSelf: "center" }}>
                  See all {fresh.total} <ChevronRightIcon />
                </Link>
              ) : null}
            </>
          ) : (
            <div className="empty">
              <h3 className="h-gold">{kind || cat ? "Nothing in this category yet" : "No videos yet"}</h3>
              <p className="muted" style={{ margin: 0, maxWidth: 420 }}>
                {kind || cat
                  ? "Be the first to share one, or look at everything else."
                  : "Share the first clip from Forever and it lands right here."}
              </p>
              <div className="row" style={{ justifyContent: "center" }}>
                <Link href="/submit" className="btn btn-gold">
                  Submit a Clip
                </Link>
                {kind || cat ? (
                  <Link href="/#fresh" className="btn btn-ghost">
                    Show everything
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <aside className="split-aside">
          <ContestsSoon />
          <TopCreatorsCard creators={creators} />
          <ActivityFeed items={activity} />
        </aside>
      </div>

      <CreatorsBand />
    </div>
  );
}
