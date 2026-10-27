-- WoW: Forever profiles: a character's spec (Shadow, Marksmanship, ...) instead of a level.
alter table public.profiles add column if not exists main_spec text;
alter table public.profiles drop constraint if exists profiles_main_spec_len;
alter table public.profiles add constraint profiles_main_spec_len check (main_spec is null or char_length(main_spec) <= 24);
grant update (main_spec) on public.profiles to authenticated;
