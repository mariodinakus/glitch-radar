-- Run after supabase/schema.sql. RLS denies clients; server-only service role manages tokens.
create table if not exists public.native_push_tokens(
 token text primary key check(char_length(token) between 30 and 300),
 user_id uuid not null references public.user_profiles(id) on delete cascade,
 platform text not null check(platform in ('android','ios')),
 last_signal_id text,
 last_sent_at timestamptz,
 updated_at timestamptz not null default now()
);
create index if not exists native_push_user_idx on public.native_push_tokens(user_id);
alter table public.native_push_tokens enable row level security;
revoke all on public.native_push_tokens from anon,authenticated;
