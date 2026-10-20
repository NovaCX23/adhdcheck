-- Waitlist from the landing page (FR-42): stored once per address, server only.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

set local role anon;
select throws_ok($$ select public.join_waitlist('parent@example.test', 'ro') $$, '42501', null, 'anon cannot call join_waitlist');
select throws_ok($$ select * from public.waitlist $$, '42501', null, 'anon cannot read the waitlist');
reset role;
set local role authenticated;
select throws_ok($$ select * from public.waitlist $$, '42501', null, 'a parent cannot read the waitlist');
reset role;

set local role service_role; -- check-secrets: allow
select public.join_waitlist('parent@example.test', 'ro');
select public.join_waitlist('parent@example.test', 'en');
reset role;
select results_eq($$ select count(*)::int from public.waitlist where email = 'parent@example.test' $$, array[1], 'an address is stored once');
select is((select lang from public.waitlist where email = 'parent@example.test'), 'ro', 'the first sign-up is kept');
select throws_ok(
  $$ insert into public.waitlist (email, lang) values ('x@example.test', 'de') $$,
  '23514', null, 'only ro and en are accepted'
);

select * from finish();
rollback;
