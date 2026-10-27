-- =============================================================================
-- Tighten who can call the database's helper functions.
--
-- * Trigger and internal functions can't be called through the API at all.
--   (Triggers still fire normally; Postgres doesn't check call permission then.)
-- * The read-only functions the site uses now run with the caller's own
--   permissions (security invoker), so the row-level security rules apply to
--   them like any other query. They only ever return public information.
-- =============================================================================

revoke execute on function
  public.gen_short_id(int),
  public.touch_updated_at(),
  public.check_active_title(),
  public.clear_revoked_title(),
  public.handle_new_user(),
  public.bump_vote_count(),
  public.bump_comment_count(),
  public.bump_view_count(),
  public.comment_rate_limit()
from public, anon, authenticated;

grant execute on function public.gen_short_id(int) to service_role;

alter function public.is_curator() security invoker;
alter function public.top_creators(int, int) security invoker;
alter function public.creator_directory(int) security invoker;
alter function public.creator_stats(uuid) security invoker;
alter function public.contest_leaderboard(uuid) security invoker;
