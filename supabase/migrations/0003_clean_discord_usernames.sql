-- Discord sends names as "username#0" (the old tag system). Drop that "#0" so new 4Ever usernames come out
-- clean, e.g. "velrisk" instead of "velrisk0". Everything else about new profiles stays the same.
-- (Replacing the function keeps the execute permissions set in 0002.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  plain_name text := nullif(regexp_replace(coalesce(meta ->> 'name', ''), '#[0-9]{1,4}$', ''), '');
  plain_full_name text := nullif(regexp_replace(coalesce(meta ->> 'full_name', ''), '#[0-9]{1,4}$', ''), '');
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
    plain_name,
    plain_full_name,
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
    plain_full_name,
    plain_name,
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
