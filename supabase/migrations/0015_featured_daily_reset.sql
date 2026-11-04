-- The Featured Video and the two after it are the most watched videos of the day, and the day turns over
-- at midnight Eastern time. Views are now recorded under the Eastern date (src/app/api/clips/[id]/view),
-- and this counts the last p_days Eastern days (1 = just today).
create or replace function public.most_watched(p_days integer, p_limit integer)
returns table (clip_id uuid, views bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select v.clip_id, count(*)::bigint
  from public.clip_views v
  join public.clips c on c.id = v.clip_id and c.status = 'approved'
  where v.day > (now() at time zone 'America/New_York')::date - least(greatest(p_days, 1), 30)
  group by v.clip_id
  order by count(*) desc, max(c.published_at) desc
  limit least(greatest(p_limit, 1), 20);
$$;

alter table public.clip_views alter column day set default (now() at time zone 'America/New_York')::date;
