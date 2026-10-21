-- Run once in your Supabase project's SQL editor (not in the public browser).
-- Account records are created by Supabase Auth; no passwords or tokens are stored here.
create table if not exists public.user_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name)<=50),
 topics text[] not null default array['all']::text[],
 min_score integer not null default 74 check(min_score between 60 and 95),
 notifications_enabled boolean not null default true,
 prefs jsonb not null default '{"follow":[],"mute":[],"read":[],"saved":[]}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint profile_topics_valid check (topics <@ array['all','world','economy','tech','climate','energy','science','sports']::text[] and cardinality(topics) between 1 and 8),
 constraint profile_prefs_valid check (jsonb_typeof(prefs)='object')
);
alter table public.user_profiles enable row level security;
grant select, update on public.user_profiles to authenticated;
drop policy if exists "Profile visible only to owner" on public.user_profiles;
create policy "Profile visible only to owner" on public.user_profiles for select to authenticated using ((select auth.uid())=id);
drop policy if exists "Profile update only by owner" on public.user_profiles;
create policy "Profile update only by owner" on public.user_profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
-- Private push subscriptions: only server service role accesses the table.
create table if not exists public.push_subscriptions (
 endpoint_hash text primary key check (char_length(endpoint_hash)=64),
 user_id uuid not null references public.user_profiles(id) on delete cascade,
 endpoint text not null,
 p256dh text not null,
 auth_key text not null,
 last_signal_id text,
 last_sent_at timestamptz,
 updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon,authenticated;
-- No public policies: service role only, with server-side JWT verification.
create or replace function public.make_glitch_profile() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.user_profiles (id) values (new.id) on conflict (id) do nothing;
 return new;
end;
$$;
drop trigger if exists auth_user_glitch_profile on auth.users;
create trigger auth_user_glitch_profile after insert on auth.users
for each row execute procedure public.make_glitch_profile();
-- Backfill preexisting signups without changing their settings.
insert into public.user_profiles(id)
select id from auth.users on conflict (id) do nothing;
