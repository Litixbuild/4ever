import Link from "next/link";
import { grantBadge, revokeBadge, setRole } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin-notice";
import { Avatar } from "@/components/people";
import { requireCurator } from "@/lib/auth";
import { BADGES, badgeInfo } from "@/lib/badges";
import { cleanSearch, formatDate } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

type PersonRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  user_badges: { badge: string }[];
};

export default async function PeopleAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; q?: string }>;
}) {
  const viewer = await requireCurator();
  const { notice, q: rawQ } = await searchParams;
  const q = cleanSearch(rawQ).replace(/[^a-zA-Z0-9_ ]/g, "");

  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, role, created_at, user_badges ( badge )")
    .order("created_at", { ascending: false })
    .limit(40);
  if (q) query = query.or(`username.ilike."%${q}%",display_name.ilike."%${q}%"`);
  const { data } = await query;
  const people = (data ?? []) as unknown as PersonRow[];

  return (
    <div className="stack-lg">
      <AdminNotice notice={notice} />
      <form action="/admin/people" method="get" className="row" role="search">
        <label htmlFor="people-search" className="sr-only">
          Search people
        </label>
        <input
          id="people-search"
          name="q"
          className="input"
          defaultValue={q}
          placeholder="Username or display name"
          style={{ flex: "1 1 280px", width: "auto" }}
        />
        <button type="submit" className="btn btn-ghost">
          Search
        </button>
      </form>

      <div className="stack">
        {people.map((person) => {
          const owned = new Set(person.user_badges.map((b) => b.badge));
          return (
            <article key={person.id} className="card stack" style={{ gap: 12, padding: 18 }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={person.display_name} src={person.avatar_url} size={40} />
                <div className="stack-sm" style={{ gap: 0, flex: 1, minWidth: 0 }}>
                  <Link href={`/u/${person.username}`} style={{ fontWeight: 800 }}>
                    {person.display_name}
                  </Link>
                  <span className="tiny muted">
                    @{person.username} · joined {formatDate(person.created_at)}
                  </span>
                </div>
                <span className={`pill ${person.role === "member" ? "pill-muted" : "pill-gold"}`}>
                  {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
                </span>
              </div>

              <div className="row" style={{ gap: 8 }}>
                {[...owned].map((key) => (
                  <form key={key} action={revokeBadge}>
                    <input type="hidden" name="userId" value={person.id} />
                    <input type="hidden" name="badge" value={key} />
                    <input type="hidden" name="returnTo" value="/admin/people" />
                    <button type="submit" className="btn btn-ghost btn-sm" title="Remove this achievement">
                      {badgeInfo(key)?.name ?? key} ✕
                    </button>
                  </form>
                ))}
                <form action={grantBadge} className="row" style={{ gap: 8 }}>
                  <input type="hidden" name="userId" value={person.id} />
                  <input type="hidden" name="returnTo" value="/admin/people" />
                  <label className="sr-only" htmlFor={`b-${person.id}`}>
                    Achievement
                  </label>
                  <select
                    id={`b-${person.id}`}
                    name="badge"
                    className="select"
                    style={{ minHeight: 36, width: 200 }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Award an achievement
                    </option>
                    {BADGES.filter((b) => !owned.has(b.key)).map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Award
                  </button>
                </form>
              </div>

              {viewer.isAdmin ? (
                <form action={setRole} className="row" style={{ gap: 8 }}>
                  <input type="hidden" name="userId" value={person.id} />
                  <input type="hidden" name="returnTo" value="/admin/people" />
                  <label className="small muted" htmlFor={`r-${person.id}`}>
                    Role
                  </label>
                  <select
                    id={`r-${person.id}`}
                    name="role"
                    className="select"
                    defaultValue={person.role}
                    style={{ minHeight: 36, width: 160 }}
                  >
                    <option value="member">Member</option>
                    <option value="curator">Curator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Save role
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
