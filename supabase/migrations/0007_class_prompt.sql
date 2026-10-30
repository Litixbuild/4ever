-- When someone was last shown the "choose your class" screen, so it only appears once
-- (on first login) unless they open it again themselves.
alter table public.profiles add column if not exists class_prompted_at timestamptz;
grant update (class_prompted_at) on public.profiles to authenticated;
