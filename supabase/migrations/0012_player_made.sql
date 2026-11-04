-- The gold "Player-made" mark: videos a player actually created and edited themselves, shown ahead of
-- raw stream clips. Set automatically for movies submitted with "I made this"; curators can add or
-- remove it on any video.
alter table public.clips add column if not exists player_made boolean not null default false;

update public.clips
set player_made = true
where kind = 'movie' and creator_id is not null and creator_id = submitted_by;

create index if not exists clips_movies_recent on public.clips (published_at desc)
  where status = 'approved' and kind = 'movie';
