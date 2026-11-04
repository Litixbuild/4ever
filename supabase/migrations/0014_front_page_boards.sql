-- Front page boards: the Horde vs Alliance war (minutes watched this week) and the three most watched
-- videos today. Both are read through the functions below, which only hand out totals.

-- Minutes watched per person per week (weeks start Monday, UTC), kept for the faction war.
create table if not exists public.faction_minutes (
  week date not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  faction text not null check (faction in ('horde', 'alliance')),
  minutes integer not null default 0,
  primary key (week, user_id)
);
alter table public.faction_minutes enable row level security;
revoke all on public.faction_minutes from anon, authenticated;

-- Same as before, and each minute that counts also goes to the person's faction for this week.
create or replace function public.award_watch_minute(p_user uuid, p_cap integer)
returns table (xp integer, awarded boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
  v_xp integer;
  v_faction text;
begin
  update public.profiles
  set xp_minutes = xp_minutes + 1,
      xp_last_at = now(),
      xp_today = case when xp_day = today then xp_today + 1 else 1 end,
      xp_day = today
  where id = p_user
    and (xp_last_at is null or xp_last_at < now() - interval '50 seconds')
    and (xp_day is distinct from today or xp_today < p_cap)
  returning xp_minutes, faction into v_xp, v_faction;

  if found then
    if v_faction in ('horde', 'alliance') then
      insert into public.faction_minutes (week, user_id, faction, minutes)
      values (date_trunc('week', today)::date, p_user, v_faction, 1)
      on conflict (week, user_id) do update
        set minutes = public.faction_minutes.minutes + 1, faction = excluded.faction;
    end if;
    return query select v_xp, true;
  else
    return query select p.xp_minutes, false from public.profiles p where p.id = p_user;
  end if;
end;
$$;

revoke all on function public.award_watch_minute(uuid, integer) from public, anon, authenticated;
grant execute on function public.award_watch_minute(uuid, integer) to service_role;

-- This week's totals per faction, with the top three watchers on each side.
create or replace function public.faction_war()
returns table (faction text, minutes bigint, leaders jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with week as (
    select f.faction, f.minutes, p.username, coalesce(p.display_name, p.username) as name
    from public.faction_minutes f
    join public.profiles p on p.id = f.user_id
    where f.week = date_trunc('week', (now() at time zone 'utc')::date)::date
  )
  select s.faction,
         coalesce(sum(w.minutes), 0)::bigint,
         coalesce((
           select jsonb_agg(jsonb_build_object('username', t.username, 'name', t.name, 'minutes', t.minutes))
           from (select * from week w2 where w2.faction = s.faction order by w2.minutes desc limit 3) t
         ), '[]'::jsonb)
  from (values ('horde'), ('alliance')) s (faction)
  left join week w on w.faction = s.faction
  group by s.faction;
$$;

-- The most watched approved videos over the last p_days days (1 = today), by distinct viewers.
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
  where v.day > (now() at time zone 'utc')::date - least(greatest(p_days, 1), 30)
  group by v.clip_id
  order by count(*) desc, max(c.published_at) desc
  limit least(greatest(p_limit, 1), 20);
$$;

revoke all on function public.faction_war() from public;
revoke all on function public.most_watched(integer, integer) from public;
grant execute on function public.faction_war() to anon, authenticated;
grant execute on function public.most_watched(integer, integer) to anon, authenticated;

-- Count minutes already watched this week by people who watched this week, so the bar starts honest.
insert into public.faction_minutes (week, user_id, faction, minutes)
select date_trunc('week', (now() at time zone 'utc')::date)::date, id, faction, xp_minutes
from public.profiles
where faction in ('horde', 'alliance') and xp_minutes > 0 and xp_last_at >= date_trunc('week', now())
on conflict do nothing;
