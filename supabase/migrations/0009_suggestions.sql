-- Suggestions people send to the admins, and the admin's reply back to them.
-- Like reports, only the server touches this table (RLS on, no policies, no grants):
-- pages read and write it with the admin client after checking who the visitor is.
create table if not exists public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles (id) on delete cascade,
  topic         text not null,
  body          text not null,
  status        text not null default 'open',
  reply         text,
  replied_by    uuid references public.profiles (id) on delete set null,
  replied_at    timestamptz,
  -- Set when the author opens /suggest after a reply, so the "new reply" dot goes away.
  reply_seen_at timestamptz,
  created_at    timestamptz not null default now(),
  constraint suggestions_topic_value check (topic in ('idea', 'bug', 'content', 'other')),
  constraint suggestions_body_len check (char_length(body) between 5 and 1500),
  constraint suggestions_reply_len check (reply is null or char_length(reply) <= 1500),
  constraint suggestions_status_value check (status in ('open', 'answered', 'closed'))
);

create index if not exists suggestions_open on public.suggestions (created_at) where status = 'open';
create index if not exists suggestions_author on public.suggestions (author_id, created_at desc);

alter table public.suggestions enable row level security;
revoke all on public.suggestions from anon, authenticated;
