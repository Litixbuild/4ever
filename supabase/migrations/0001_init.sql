-- =============================================================================
-- 4Everclips database
--
-- Run this once in Supabase: SQL Editor -> New query -> paste everything -> Run.
-- It creates every table, the security rules (Row Level Security), and the
-- helper functions the site uses. Running it twice will fail on "already exists",
-- which is harmless.
--
-- The security model in one paragraph:
--   * Anyone can read approved clips, profiles, comments, contests and badges.
--   * Logged-in people can vote, favorite, comment, and edit their own profile.
--   * Clips, channels, badges, contests, features and reports can only be
--     written by the site's server (using the secret key). That is what stops
--     anyone from faking who made a video: the server looks the video up on
--     YouTube or Twitch itself and writes the real channel name.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Short, URL-friendly ids for clip links like 4everclips.com/c/k3J9xP2a
create or replace function public.gen_short_id(len int default 8)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  chars constant text := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..len loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- Profiles (one per account, created automatically on first login)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       text not null,
  display_name   text not null,
  avatar_url     text,
  bio            text,
  main_character text,
  main_level     int,
  main_race      text,
  main_class     text,
  realm          text,
  guild          text,
  faction        text,
  active_title   text,
  role           text not null default 'member',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_display_name_len check (char_length(btrim(display_name)) between 1 and 40),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 280),
  constraint profiles_main_character_len check (main_character is null or char_length(main_character) <= 24),
  constraint profiles_main_level_range check (main_level is null or main_level between 1 and 60),
  constraint profiles_main_race_len check (main_race is null or char_length(main_race) <= 24),
  constraint profiles_main_class_len check (main_class is null or char_length(main_class) <= 24),
  constraint profiles_realm_len check (realm is null or char_length(realm) <= 40),
  constraint profiles_guild_len check (guild is null or char_length(guild) <= 40),
  constraint profiles_faction_value check (faction is null or faction in ('horde', 'alliance')),
  constraint profiles_role_value check (role in ('member', 'curator', 'admin'))
);

create unique index profiles_username_unique on public.profiles (username);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Is the current visitor a curator or admin?
create or replace function public.is_curator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('curator', 'admin')
  );
$$;


-- -----------------------------------------------------------------------------
-- Badges (earned titles and achievements)
-- -----------------------------------------------------------------------------

create table public.user_badges (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge      text not null,
  awarded_at timestamptz not null default now(),
  note       text,
  primary key (user_id, badge),
  constraint user_badges_badge_value check (
    badge in ('founding_creator', 'verified_creator', 'movie_of_the_week', 'contest_winner', 'curator')
  )
);

create index user_badges_awarded on public.user_badges (awarded_at desc);

-- People can only show a title they have actually earned.
create or replace function public.check_active_title()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.active_title is not null and not exists (
    select 1 from public.user_badges b
    where b.user_id = new.id and b.badge = new.active_title
  ) then
    raise exception 'You have not earned that title yet';
  end if;
  return new;
end;
$$;

create trigger profiles_check_active_title
  before insert or update of active_title on public.profiles
  for each row execute function public.check_active_title();

-- If a badge is taken away, stop showing it as a title.
create or replace function public.clear_revoked_title()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set active_title = null
  where id = old.user_id and active_title = old.badge;
  return null;
end;
$$;

create trigger user_badges_clear_title
  after delete on public.user_badges
  for each row execute function public.clear_revoked_title();


-- -----------------------------------------------------------------------------
-- New accounts: create a profile from whatever Discord/Twitch/Google sends us
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  candidate text;
  display text;
  attempts int := 0;
begin
  base := coalesce(
    nullif(meta ->> 'user_name', ''),
    nullif(meta ->> 'preferred_username', ''),
    nullif(meta ->> 'nickname', ''),
    nullif(meta ->> 'slug', ''),
    nullif(meta ->> 'name', ''),
    nullif(meta ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'adventurer'
  );
  base := lower(regexp_replace(base, '[^A-Za-z0-9_]', '', 'g'));
  if char_length(base) < 3 then
    base := 'adventurer';
  end if;
  base := left(base, 18);

  candidate := base;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    attempts := attempts + 1;
    if attempts > 25 then
      candidate := 'adventurer' || floor(random() * 900000 + 100000)::int::text;
    else
      candidate := base || floor(random() * 9000 + 1000)::int::text;
    end if;
  end loop;

  display := left(btrim(coalesce(
    nullif(meta -> 'custom_claims' ->> 'global_name', ''),
    nullif(meta ->> 'full_name', ''),
    nullif(meta ->> 'name', ''),
    candidate
  )), 40);
  if display is null or display = '' then
    display := candidate;
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    display,
    nullif(coalesce(meta ->> 'avatar_url', meta ->> 'picture'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- Channels a creator has proven they own (YouTube or Twitch)
-- -----------------------------------------------------------------------------

create table public.channels (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  platform          text not null,
  channel_id        text not null,
  channel_name      text not null,
  channel_url       text,
  verification_code text,
  verified_at       timestamptz,
  created_at        timestamptz not null default now(),
  constraint channels_platform_value check (platform in ('youtube', 'twitch')),
  constraint channels_user_channel_unique unique (user_id, platform, channel_id)
);

-- A channel can only be verified by one account.
create unique index channels_verified_unique
  on public.channels (platform, channel_id)
  where verified_at is not null;

create index channels_user on public.channels (user_id);


-- -----------------------------------------------------------------------------
-- Clips and movies
-- -----------------------------------------------------------------------------

create table public.clips (
  id               uuid primary key default gen_random_uuid(),
  short_id         text not null default public.gen_short_id(8),
  platform         text not null,
  source_type      text not null,
  source_id        text not null,
  source_url       text not null,
  title            text not null,
  description      text,
  thumbnail_url    text,
  duration_seconds int,
  channel_id       text,
  channel_name     text not null,
  channel_url      text,
  creator_id       uuid,
  submitted_by     uuid,
  kind             text not null,
  category         text not null,
  tags             text[] not null default '{}',
  music_source     text not null,
  music_credit     text,
  status           text not null default 'pending',
  review_note      text,
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  published_at     timestamptz,
  view_count       int not null default 0,
  vote_count       int not null default 0,
  comment_count    int not null default 0,
  created_at       timestamptz not null default now(),
  constraint clips_short_id_unique unique (short_id),
  constraint clips_source_unique unique (source_type, source_id),
  constraint clips_creator_id_fkey foreign key (creator_id) references public.profiles (id) on delete set null,
  constraint clips_submitted_by_fkey foreign key (submitted_by) references public.profiles (id) on delete set null,
  constraint clips_reviewed_by_fkey foreign key (reviewed_by) references public.profiles (id) on delete set null,
  constraint clips_platform_value check (platform in ('youtube', 'twitch')),
  constraint clips_source_type_value check (source_type in ('youtube_video', 'twitch_clip', 'twitch_video')),
  constraint clips_title_len check (char_length(title) between 1 and 140),
  constraint clips_description_len check (description is null or char_length(description) <= 600),
  constraint clips_kind_value check (kind in ('movie', 'clip')),
  constraint clips_category_value check (
    category in ('world-pvp', 'battlegrounds', 'duels', 'raids-dungeons', 'machinima', 'funny', 'lore', 'leveling', 'other')
  ),
  constraint clips_tags_count check (cardinality(tags) <= 5),
  constraint clips_music_source_value check (music_source in ('original', 'game', 'licensed', 'none')),
  constraint clips_music_credit_len check (music_credit is null or char_length(music_credit) <= 200),
  constraint clips_status_value check (status in ('pending', 'approved', 'rejected', 'removed'))
);

create index clips_published on public.clips (published_at desc) where status = 'approved';
create index clips_views on public.clips (view_count desc) where status = 'approved';
create index clips_votes on public.clips (vote_count desc) where status = 'approved';
create index clips_status_created on public.clips (status, created_at);
create index clips_creator on public.clips (creator_id);
create index clips_submitted_by on public.clips (submitted_by);
create index clips_channel on public.clips (platform, channel_id);
create index clips_tags on public.clips using gin (tags);


-- -----------------------------------------------------------------------------
-- Votes, favorites, comments
-- -----------------------------------------------------------------------------

create table public.votes (
  clip_id    uuid not null references public.clips (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);

create index votes_user on public.votes (user_id);
create index votes_created on public.votes (created_at desc);

create table public.favorites (
  clip_id    uuid not null references public.clips (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);

create index favorites_user on public.favorites (user_id, created_at desc);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  clip_id    uuid not null references public.clips (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  constraint comments_body_len check (char_length(btrim(body)) between 1 and 1000)
);

create index comments_clip on public.comments (clip_id, created_at);
create index comments_user on public.comments (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- Views (each viewer counts once per clip per day; no IP addresses are stored)
-- -----------------------------------------------------------------------------

create table public.clip_views (
  clip_id     uuid not null references public.clips (id) on delete cascade,
  viewer_hash text not null,
  day         date not null default current_date,
  primary key (clip_id, viewer_hash, day)
);


-- -----------------------------------------------------------------------------
-- Movie of the Week
-- -----------------------------------------------------------------------------

create table public.features (
  id          uuid primary key default gen_random_uuid(),
  clip_id     uuid not null references public.clips (id) on delete cascade,
  use_text    text,
  flavor_text text,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint features_use_text_len check (use_text is null or char_length(use_text) <= 120),
  constraint features_flavor_text_len check (flavor_text is null or char_length(flavor_text) <= 120)
);

create index features_starts on public.features (starts_at desc);


-- -----------------------------------------------------------------------------
-- Contests
-- -----------------------------------------------------------------------------

create table public.contests (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  title       text not null,
  tagline     text,
  description text,
  rules       text,
  prizes      text[] not null default '{}',
  opens_at    timestamptz not null,
  closes_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now(),
  constraint contests_slug_unique unique (slug),
  constraint contests_slug_format check (slug ~ '^[a-z0-9-]{3,60}$'),
  constraint contests_title_len check (char_length(title) between 1 and 80),
  constraint contests_dates_order check (opens_at < closes_at and closes_at <= ends_at)
);

create table public.contest_entries (
  contest_id uuid not null references public.contests (id) on delete cascade,
  clip_id    uuid not null references public.clips (id) on delete cascade,
  entered_by uuid not null references public.profiles (id) on delete cascade,
  placement  int,
  created_at timestamptz not null default now(),
  primary key (contest_id, clip_id),
  constraint contest_entries_placement_range check (placement is null or placement between 1 and 3)
);


-- -----------------------------------------------------------------------------
-- Reports (removal requests, wrong credit, copyright, spam)
-- -----------------------------------------------------------------------------

create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  clip_id       uuid references public.clips (id) on delete cascade,
  reporter_id   uuid references public.profiles (id) on delete set null,
  reason        text not null,
  details       text,
  contact_email text,
  status        text not null default 'open',
  resolved_by   uuid references public.profiles (id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  constraint reports_reason_value check (
    reason in ('my_video_remove', 'copyright', 'wrong_credit', 'inappropriate', 'spam', 'other')
  ),
  constraint reports_details_len check (details is null or char_length(details) <= 2000),
  constraint reports_contact_len check (contact_email is null or char_length(contact_email) <= 200),
  constraint reports_status_value check (status in ('open', 'resolved', 'dismissed'))
);

create index reports_open on public.reports (created_at) where status = 'open';


-- -----------------------------------------------------------------------------
-- Counters kept in sync automatically
-- -----------------------------------------------------------------------------

create or replace function public.bump_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.clips set vote_count = vote_count + 1 where id = new.clip_id;
  elsif tg_op = 'DELETE' then
    update public.clips set vote_count = greatest(vote_count - 1, 0) where id = old.clip_id;
  end if;
  return null;
end;
$$;

create trigger votes_bump_count
  after insert or delete on public.votes
  for each row execute function public.bump_vote_count();

create or replace function public.bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.clips set comment_count = comment_count + 1 where id = new.clip_id;
  elsif tg_op = 'DELETE' then
    update public.clips set comment_count = greatest(comment_count - 1, 0) where id = old.clip_id;
  end if;
  return null;
end;
$$;

create trigger comments_bump_count
  after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

create or replace function public.bump_view_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.clips set view_count = view_count + 1 where id = new.clip_id;
  return null;
end;
$$;

create trigger clip_views_bump_count
  after insert on public.clip_views
  for each row execute function public.bump_view_count();

-- Slow down comment spam: one comment every 15 seconds per person.
create or replace function public.comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.comments c
    where c.user_id = new.user_id and c.created_at > now() - interval '15 seconds'
  ) then
    raise exception 'You are commenting a little fast. Try again in a few seconds.';
  end if;
  return new;
end;
$$;

create trigger comments_rate_limit
  before insert on public.comments
  for each row execute function public.comment_rate_limit();


-- -----------------------------------------------------------------------------
-- Read-only helper functions used by the site
-- -----------------------------------------------------------------------------

-- Creators whose videos got the most votes recently.
create or replace function public.top_creators(p_days int default 7, p_limit int default 5)
returns table (id uuid, username text, display_name text, avatar_url text, votes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, count(*) as votes
  from public.votes v
  join public.clips c on c.id = v.clip_id and c.status = 'approved'
  join public.profiles p on p.id = c.creator_id
  where v.created_at > now() - make_interval(days => p_days)
  group by p.id, p.username, p.display_name, p.avatar_url
  order by votes desc
  limit p_limit;
$$;

-- Everyone with at least one approved video, most watched first.
create or replace function public.creator_directory(p_limit int default 60)
returns table (
  id uuid, username text, display_name text, avatar_url text, active_title text,
  faction text, clip_count bigint, total_views bigint, total_votes bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.active_title, p.faction,
         count(c.id) as clip_count,
         coalesce(sum(c.view_count), 0) as total_views,
         coalesce(sum(c.vote_count), 0) as total_votes
  from public.profiles p
  join public.clips c on c.creator_id = p.id and c.status = 'approved'
  group by p.id, p.username, p.display_name, p.avatar_url, p.active_title, p.faction
  order by total_views desc, total_votes desc
  limit p_limit;
$$;

-- Numbers shown on a creator's profile.
create or replace function public.creator_stats(p_user uuid)
returns table (clip_count bigint, total_views bigint, total_votes bigint, times_featured bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.clips c where c.creator_id = p_user and c.status = 'approved'),
    (select coalesce(sum(c.view_count), 0) from public.clips c where c.creator_id = p_user and c.status = 'approved'),
    (select coalesce(sum(c.vote_count), 0) from public.clips c where c.creator_id = p_user and c.status = 'approved'),
    (select count(*) from public.features f join public.clips c on c.id = f.clip_id where c.creator_id = p_user);
$$;

-- Contest standings: votes cast while the contest was running.
create or replace function public.contest_leaderboard(p_contest uuid)
returns table (clip_id uuid, window_votes bigint, placement int)
language sql
stable
security definer
set search_path = ''
as $$
  select e.clip_id,
         (select count(*) from public.votes v
          where v.clip_id = e.clip_id and v.created_at between ct.opens_at and ct.ends_at) as window_votes,
         e.placement
  from public.contest_entries e
  join public.contests ct on ct.id = e.contest_id
  join public.clips c on c.id = e.clip_id and c.status = 'approved'
  where e.contest_id = p_contest
  order by e.placement asc nulls last, window_votes desc, e.created_at asc;
$$;


-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.user_badges     enable row level security;
alter table public.channels        enable row level security;
alter table public.clips           enable row level security;
alter table public.votes           enable row level security;
alter table public.favorites       enable row level security;
alter table public.comments        enable row level security;
alter table public.clip_views      enable row level security;
alter table public.features        enable row level security;
alter table public.contests        enable row level security;
alter table public.contest_entries enable row level security;
alter table public.reports         enable row level security;

-- Profiles: public; you can edit your own (only the columns granted below).
create policy "Profiles are public" on public.profiles
  for select using (true);
create policy "Edit your own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Badges: public. Only the server awards them.
create policy "Badges are public" on public.user_badges
  for select using (true);

-- Channels: verified ones are public; you can see your own pending ones.
create policy "Verified channels are public" on public.channels
  for select using (verified_at is not null or (select auth.uid()) = user_id);

-- Clips: approved ones are public. Submitters and creators see their own.
create policy "Approved clips are public" on public.clips
  for select using (
    status = 'approved'
    or submitted_by = (select auth.uid())
    or creator_id = (select auth.uid())
    or (select public.is_curator())
  );

-- Votes.
create policy "Vote counts are public" on public.votes
  for select using (true);
create policy "Vote on approved clips" on public.votes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.clips c where c.id = clip_id and c.status = 'approved')
  );
create policy "Take back your own vote" on public.votes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Favorites (shown on profiles, so readable by everyone).
create policy "Favorites are public" on public.favorites
  for select using (true);
create policy "Favorite approved clips" on public.favorites
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.clips c where c.id = clip_id and c.status = 'approved')
  );
create policy "Remove your own favorites" on public.favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Comments.
create policy "Comments on approved clips are public" on public.comments
  for select using (
    exists (select 1 from public.clips c where c.id = clip_id and c.status = 'approved')
    or (select public.is_curator())
  );
create policy "Comment on approved clips" on public.comments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.clips c where c.id = clip_id and c.status = 'approved')
  );
create policy "Delete your own comments, curators delete any" on public.comments
  for delete to authenticated
  using ((select auth.uid()) = user_id or (select public.is_curator()));

-- Features, contests, entries: public to read.
create policy "Features are public" on public.features
  for select using (true);
create policy "Contests are public" on public.contests
  for select using (true);
create policy "Contest entries are public" on public.contest_entries
  for select using (true);

-- clip_views and reports have no policies at all: only the server can touch them.


-- -----------------------------------------------------------------------------
-- Table permissions
-- An explicit allowlist, on top of the policies above. Anything not granted
-- here can only be done by the site's server.
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles, public.user_badges, public.channels, public.clips, public.votes,
  public.favorites, public.comments, public.features, public.contests, public.contest_entries
to anon, authenticated;

grant insert, delete on public.votes, public.favorites, public.comments to authenticated;

grant update (
  username, display_name, bio, main_character, main_level, main_race,
  main_class, realm, guild, faction, active_title
) on public.profiles to authenticated;

-- clip_views and reports get no grants at all.
