-- Clips a curator posts on the site's behalf show "Shared by 4Ever" instead of the curator's name.
alter table public.clips add column if not exists shared_as_site boolean not null default false;
-- A curator fixed this title by hand (say, a crude Twitch clip title), so the daily refresh keeps it.
alter table public.clips add column if not exists title_locked boolean not null default false;

-- Everything curators have posted from other people's channels so far was seeding the site.
update public.clips c
set shared_as_site = true
from public.profiles p
where p.id = c.submitted_by
  and p.role in ('curator', 'admin')
  and (c.creator_id is null or c.creator_id <> c.submitted_by);
