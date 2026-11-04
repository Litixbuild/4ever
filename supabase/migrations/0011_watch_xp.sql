-- Watch-time XP for the PvP-style ranks (src/lib/ranks.ts). One minute watched = 1 XP.
-- Only the server can add XP, through award_watch_minute(); people can't edit these columns.
alter table public.profiles add column if not exists xp_minutes integer not null default 0;
alter table public.profiles add column if not exists xp_last_at timestamptz;
alter table public.profiles add column if not exists xp_day date;
alter table public.profiles add column if not exists xp_today integer not null default 0;

-- Adds one minute of XP, but at most one per 50 seconds and at most p_cap per (UTC) day.
-- Returns the person's XP afterwards and whether this call counted.
create or replace function public.award_watch_minute(p_user uuid, p_cap integer)
returns table (xp integer, awarded boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
  v_xp integer;
begin
  update public.profiles
  set xp_minutes = xp_minutes + 1,
      xp_last_at = now(),
      xp_today = case when xp_day = today then xp_today + 1 else 1 end,
      xp_day = today
  where id = p_user
    and (xp_last_at is null or xp_last_at < now() - interval '50 seconds')
    and (xp_day is distinct from today or xp_today < p_cap)
  returning xp_minutes into v_xp;

  if found then
    return query select v_xp, true;
  else
    return query select p.xp_minutes, false from public.profiles p where p.id = p_user;
  end if;
end;
$$;

revoke all on function public.award_watch_minute(uuid, integer) from public, anon, authenticated;
grant execute on function public.award_watch_minute(uuid, integer) to service_role;
