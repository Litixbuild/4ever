import type { Metadata } from "next";
import Link from "next/link";
import { ClipGrid } from "@/components/clip-card";
import { RarityLegend } from "@/components/widgets";
import { CATEGORIES, categoryLabel, isCategory, isKind } from "@/lib/categories";
import { cleanSearch } from "@/lib/format";
import { isClipSort, listClips, type ClipSort } from "@/lib/queries";

type Search = { kind?: string; cat?: string; sort?: string; q?: string; tag?: string; page?: string };

const SORTS: { value: ClipSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "views", label: "Most watched" },
  { value: "votes", label: "Most voted" },
];

const PER_PAGE = 24;

function heading(kind: string | null, cat: string | null, q: string, tag: string) {
  if (q) return `Results for “${q}”`;
  if (tag) return `#${tag}`;
  const base = kind === "movie" ? "Movies" : kind === "clip" ? "Clips" : "Everything";
  return cat ? `${categoryLabel(cat)} ${kind ? base.toLowerCase() : ""}`.trim() : base;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const p = await searchParams;
  const kind = isKind(p.kind) ? p.kind : null;
  const cat = isCategory(p.cat) ? p.cat : null;
  return { title: heading(kind, cat, cleanSearch(p.q), (p.tag ?? "").replace(/[^a-z0-9-]/g, "")) };
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Search> }) {
  const p = await searchParams;
  const kind = isKind(p.kind) ? p.kind : null;
  const cat = isCategory(p.cat) ? p.cat : null;
  const sort: ClipSort = isClipSort(p.sort) ? p.sort : "new";
  const q = cleanSearch(p.q);
  const tag = (p.tag ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  const page = Math.max(1, Math.min(500, Number.parseInt(p.page ?? "1", 10) || 1));

  const { clips, total } = await listClips({ kind, category: cat, sort, q, tag, page, perPage: PER_PAGE });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  function href(overrides: Partial<Record<keyof Search, string | null>>) {
    const next = new URLSearchParams();
    const merged: Record<string, string | null> = {
      kind,
      cat,
      sort: sort === "new" ? null : sort,
      q: q || null,
      tag: tag || null,
      page: null,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const query = next.toString();
    return `/browse${query ? `?${query}` : ""}`;
  }

  return (
    <div className="container page" style={{ gap: 28 }}>
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">Browse</span>
        <h1 className="h1">{heading(kind, cat, q, tag)}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {total === 1 ? "1 video" : `${total.toLocaleString("en-US")} videos`}
          {q || tag ? (
            <>
              {" "}
              · <Link href={href({ q: null, tag: null })}>Clear search</Link>
            </>
          ) : null}
        </p>
        <RarityLegend />
      </div>

      <div className="row-between">
        <nav aria-label="Type" className="seg">
          <Link href={href({ kind: null })} aria-current={!kind ? "true" : undefined}>
            All
          </Link>
          <Link href={href({ kind: "movie" })} aria-current={kind === "movie" ? "true" : undefined}>
            Movies
          </Link>
          <Link href={href({ kind: "clip" })} aria-current={kind === "clip" ? "true" : undefined}>
            Clips
          </Link>
        </nav>
        <nav aria-label="Sort" className="seg">
          {SORTS.map((s) => (
            <Link key={s.value} href={href({ sort: s.value === "new" ? null : s.value })} aria-current={sort === s.value ? "true" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      <nav aria-label="Categories" className="chips">
        <Link href={href({ cat: null })} className="chip" aria-current={!cat ? "true" : undefined}>
          All categories
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.value} href={href({ cat: c.value })} className="chip" aria-current={cat === c.value ? "true" : undefined}>
            {c.label}
          </Link>
        ))}
      </nav>

      {clips.length > 0 ? (
        <ClipGrid clips={clips} />
      ) : (
        <div className="empty">
          <h2 className="h3">No videos found</h2>
          <p className="muted" style={{ margin: 0 }}>
            Try a different filter, or be the one who fills this spot.
          </p>
          <Link href="/submit" className="btn btn-gold">
            Submit a Clip
          </Link>
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="row" style={{ justifyContent: "center" }}>
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className="btn btn-ghost">
              Previous
            </Link>
          ) : null}
          <span className="small muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className="btn btn-ghost">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
