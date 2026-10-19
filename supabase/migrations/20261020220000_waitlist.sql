-- Waitlist (FR-42 landing page): early-access sign-ups. Email and language only, stored once per address.
-- Server only (service role, NFR-12): RLS on, no policy, no grant to anon or authenticated.
-- join_waitlist answers nothing about whether the address was already listed.

create table public.waitlist (
  email text primary key check (email = lower(email) and char_length(email) <= 254),
  lang text not null check (lang in ('ro', 'en')),
  created_at timestamptz not null default now()
);

revoke all on public.waitlist from anon, authenticated;
alter table public.waitlist enable row level security;

create function public.join_waitlist(p_email text, p_lang text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.waitlist (email, lang) values (lower(p_email), p_lang) on conflict (email) do nothing;
$$;

revoke execute on function public.join_waitlist(text, text) from public, anon, authenticated;
grant select, insert on public.waitlist to service_role; -- check-secrets: allow
grant execute on function public.join_waitlist(text, text) to service_role; -- check-secrets: allow
