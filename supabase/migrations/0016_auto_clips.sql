-- The clip finder: every hour the site looks on YouTube for brand new WoW Forever clips
-- (under a minute, embeddable) and adds them as 4Ever. Twitch is never searched; people can still submit it.

-- Marks videos the finder added, so curators can tell them apart.
alter table public.clips add column if not exists auto_found boolean not null default false;

-- Channels the finder must skip (reposters, spam). Curators add to it with "Block this channel".
create table if not exists public.clip_source_blocks (
  channel_id text primary key,
  channel_name text,
  created_at timestamptz not null default now()
);
alter table public.clip_source_blocks enable row level security;
revoke all on public.clip_source_blocks from anon, authenticated;
