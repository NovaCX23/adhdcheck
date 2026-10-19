-- FR-01: play links are issued for the parent's own child, expire, and are used up by one session.
-- NFR-13: take_rate_limit counts posts per key in a fixed window.
-- NFR-12: these functions and tables are for the service role only.
-- FR-41: deleting a child deletes its play links.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'parent-b@example.test');
insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'Test Fox', 2018),
  ('00000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b', 'Test Owl', 2017);

-- Synthetic hashes (64 hex characters).
create temp table h as select
  repeat('a', 64) as a1, repeat('b', 64) as a2, repeat('c', 64) as old, repeat('d', 64) as other;
grant select on h to anon, authenticated, service_role; -- check-secrets: allow

-- Closed to parents and anon.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select throws_ok($$ select * from public.play_links $$, '42501', null, 'a parent cannot read play_links');
select throws_ok($$ select * from public.rate_limits $$, '42501', null, 'a parent cannot read rate_limits');
select throws_ok(
  $$ select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ca', (select a1 from h), now() + interval '1 hour') $$,
  '42501', null, 'a parent cannot call issue_play_link directly'
);
select throws_ok($$ select public.resolve_play_link((select a1 from h)) $$, '42501', null, 'a parent cannot call resolve_play_link');
select throws_ok($$ select public.take_rate_limit('k', 1, 60) $$, '42501', null, 'a parent cannot call take_rate_limit');
reset role;
set local role anon;
select throws_ok($$ select public.resolve_play_link((select a1 from h)) $$, '42501', null, 'anon cannot call resolve_play_link');
reset role;

set local role service_role; -- check-secrets: allow
select is(
  (select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ca', a1, now() + interval '1 hour') from h),
  true, 'a parent gets a play link for their own child'
);
select is(
  (select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000cb', other, now() + interval '1 hour') from h),
  false, 'a parent gets no play link for another parent''s child'
);
select is(
  (select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ff', other, now() + interval '1 hour') from h),
  false, 'no play link for a child that does not exist'
);
select is(
  (select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ca', old, now() - interval '1 second') from h),
  true, 'an already expired link can be stored (for the expiry test)'
);
select is((select public.resolve_play_link(a1) from h), '00000000-0000-0000-0000-0000000000ca'::uuid, 'a valid link resolves to its child');
select is((select public.resolve_play_link(old) from h), null, 'an expired link resolves to nothing');
select is((select public.resolve_play_link(a2) from h), null, 'an unknown link resolves to nothing');
reset role;

select results_eq($$ select count(*)::int from public.play_links where code_hash = (select other from h) $$, array[0], 'refused links are not stored');
select is(
  (select parent_id from public.play_links where code_hash = (select a1 from h)),
  '00000000-0000-0000-0000-00000000000a'::uuid,
  'the link keeps the child''s parent'
);

-- A used link resolves to nothing (save_session sets session_id; see save_session.test.sql).
update public.play_links set session_id = '00000000-0000-0000-0000-00000000005a' where code_hash = (select a1 from h);
set local role service_role; -- check-secrets: allow
select is((select public.resolve_play_link(a1) from h), null, 'a used link resolves to nothing');

-- Rate limit: 3 per window, then refused; a new window starts over; keys are separate.
select is(public.take_rate_limit('sessions:x', 3, 60), true, 'hit 1 of 3 allowed');
select is(public.take_rate_limit('sessions:x', 3, 60), true, 'hit 2 of 3 allowed');
select is(public.take_rate_limit('sessions:x', 3, 60), true, 'hit 3 of 3 allowed');
select is(public.take_rate_limit('sessions:x', 3, 60), false, 'hit 4 is refused');
select is(public.take_rate_limit('sessions:y', 3, 60), true, 'another key has its own count');
reset role;
update public.rate_limits set window_start = now() - interval '61 seconds' where bucket = 'sessions:x';
set local role service_role; -- check-secrets: allow
select is(public.take_rate_limit('sessions:x', 3, 60), true, 'after the window the count starts over');
reset role;

-- Expired windows of other keys are deleted.
update public.rate_limits set window_start = now() - interval '61 seconds' where bucket = 'sessions:y';
set local role service_role; -- check-secrets: allow
select public.take_rate_limit('sessions:x', 3, 60);
reset role;
select results_eq($$ select count(*)::int from public.rate_limits where bucket = 'sessions:y' $$, array[0], 'old windows are cleaned up');

-- FR-41
delete from public.children where id = '00000000-0000-0000-0000-0000000000ca';
select results_eq($$ select count(*)::int from public.play_links $$, array[0], 'deleting the child deletes its play links');

select * from finish();
rollback;
