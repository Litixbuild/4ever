import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipGrid } from "@/components/clip-card";
import { EmptyHero } from "@/components/hero";
import { CategoryTiles, FactionWarBar, HOME_CATEGORIES, PlayerMadeShelf } from "@/components/home-boards";
import { HomeStage } from "@/components/home-stage";
import { ActivityFeed, LaunchBar } from "@/components/widgets";
import { isCategory, isKind } from "@/lib/categories";
import { uploadedAgo } from "@/lib/format";
import type { Clip } from "@/lib/types";
import {
  getActivity,
  getCategoryCovers,
  getCurrentFeature,
  getFactionWar,
  getHeroFallback,
  getMostWatchedToday,
  getPlayerMade,
  listClips,
} from "@/lib/queries";

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

  const [feature, fresh, activity, latest, war, covers, made] = await Promise.all([
    getCurrentFeature(),
    listClips({ kind, category: cat, perPage: PER_PAGE, page, sort: "new" }),
    getActivity(6),
    listClips({ perPage: 24, sort: "new" }),
    getFactionWar(),
    getCategoryCovers(HOME_CATEGORIES),
    getPlayerMade(8),
  ]);
  // The top three are the most watched videos today. On a quiet day the admin's pick, the top movie and
  // the newest videos fill the gaps.
  const top = await getMostWatchedToday(3, [feature?.clip ?? null, await getHeroFallback(), ...latest.clips]);
  // The big player's queue: the top three, then the newest videos for the rail to slide through.
  const queue: Clip[] = [];
  for (const c of [...top, ...latest.clips]) {
    if (c && !queue.some((q) => q.id === c.id)) queue.push(c);
  }
  const ages = Object.fromEntries(queue.map((c) => [c.id, uploadedAgo(c)]));
  const featureNotes = feature && feature.clip?.id === queue[0]?.id ? feature : null;

  const lastPage = Math.max(1, Math.ceil(fresh.total / PER_PAGE));
  // A page past the end (an old link) goes to the last page that has videos.
  if (page > lastPage && fresh.total > 0) redirect(homeHref(kind, cat, lastPage));

  return (
    <div className="container page">
      <div className="stack" style={{ gap: 20 }}>
        <LaunchBar />
        {queue.length > 0 ? (
          <HomeStage queue={queue.slice(0, 24)} ages={ages} feature={featureNotes} ranked={top.length} />
        ) : (
          <EmptyHero />
        )}
      </div>

      <div className="home-boards">
        <FactionWarBar war={war} />
        <CategoryTiles covers={covers} />
        <PlayerMadeShelf clips={made} />
      </div>

      <div className="split">
        <section aria-label="Videos" className="split-main stack" style={{ gap: 22 }} id="fresh">
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
          <ActivityFeed items={activity} />
        </aside>
      </div>
    </div>
  );
}
