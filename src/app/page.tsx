import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipGrid } from "@/components/clip-card";
import { PlayIcon } from "@/components/icons";
import { EmptyHero, Hero } from "@/components/hero";
import { ActivityFeed, ContestsSoon, LaunchBar } from "@/components/widgets";
import { CATEGORIES, isCategory, isKind } from "@/lib/categories";
import { getActivity, getCurrentFeature, getHeroFallback, getTrendingMovies, listClips } from "@/lib/queries";
import { PlayerMadeMark } from "@/components/player-made";

const PER_PAGE = 9;

// Links back to the front page's video grid (#fresh), keeping the filters. Page 1 has no ?page.
function homeHref(kind: string | null, cat: string | null, page = 1) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (cat) params.set("cat", cat);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#fresh`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; cat?: string; page?: string }>;
}) {
  const params = await searchParams;
  const kind = isKind(params.kind) ? params.kind : null;
  const cat = isCategory(params.cat) ? params.cat : null;
  // Nine videos a page, with Previous / Next page like /browse, so it's easy to keep your place.
  const page = Math.min(Math.max(Number.parseInt(params.page ?? "", 10) || 1, 1), 500);

  const [feature, fresh, activity, trending] = await Promise.all([
    getCurrentFeature(),
    listClips({ kind, category: cat, perPage: PER_PAGE, page, sort: "new" }),
    getActivity(6),
    getTrendingMovies(7),
  ]);
  const heroClip = feature?.clip ?? (await getHeroFallback());
  // The movie already in the big spot up top isn't repeated in the row below it.
  const trendingRow = trending.filter((c) => c.id !== heroClip?.id).slice(0, 6);
  // Filters only make sense once there is something to filter.
  const hasAny = fresh.total > 0 || Boolean(kind || cat);

  const lastPage = Math.max(1, Math.ceil(fresh.total / PER_PAGE));
  // A page past the end (an old link) goes to the last page that has videos.
  if (page > lastPage && fresh.total > 0) redirect(homeHref(kind, cat, lastPage));

  return (
    <div className="container page">
      <div className="stack" style={{ gap: 20 }}>
        <LaunchBar />
        {heroClip ? <Hero clip={heroClip} feature={feature} /> : <EmptyHero />}
      </div>

      <section aria-labelledby="trending-movies" className="stack trending-movies" style={{ gap: 18 }}>
        <div className="row-between">
          <div className="stack-sm" style={{ gap: 4 }}>
            <h2 id="trending-movies" className="h2">
              Trending movies
            </h2>
            <span className="small muted">Edited by players, not cut from a stream.</span>
          </div>
          {trendingRow.length > 0 ? (
            <Link href="/browse?kind=movie" className="btn btn-ghost">
              All movies
            </Link>
          ) : null}
        </div>
        {trendingRow.length > 0 ? (
          <ClipGrid clips={trendingRow} threeUp />
        ) : (
          <div className="trending-empty">
            <PlayerMadeMark />
            <div className="stack-sm" style={{ gap: 4, flex: "1 1 260px" }}>
              <strong>Made a Forever movie? It goes here first.</strong>
              <span className="small muted">
                Edits, PvP movies, machinima, anything you cut together yourself. Share it as a movie and pick &ldquo;I
                made this&rdquo; to get the gold Player-made mark.
              </span>
            </div>
            <Link href="/submit" className="btn btn-gold">
              Submit a movie
            </Link>
          </div>
        )}
      </section>

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
              {lastPage > 1 ? (
                <nav aria-label="Pages" className="pager">
                  {page > 1 ? (
                    <Link href={homeHref(kind, cat, page - 1)} className="btn btn-ghost btn-lg">
                      Previous
                    </Link>
                  ) : null}
                  {page < lastPage ? (
                    <Link href={homeHref(kind, cat, page + 1)} className="btn btn-gold btn-lg">
                      Next page
                    </Link>
                  ) : null}
                </nav>
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
          <ActivityFeed items={activity} />
        </aside>
      </div>

      <Link href="/help" className="help-strip">
        <span>
          <strong>New here?</strong> How credit, ranks and sharing clips work on 4Ever.
        </span>
        <span className="help-strip-go">Read how it works</span>
      </Link>
    </div>
  );
}
