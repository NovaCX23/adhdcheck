-- FR-37: a parent adds a mission for their own child, marks it done, and sees it in history.
-- NFR-52: missions are chosen by the parent; no one can write chosen_by, so nothing assigns a mission.
-- NFR-11: parent B sees and changes nothing of parent A.
-- FR-41: deleting a child deletes its missions.
-- Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'parent-b@example.test');
insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'Test Fox', 2018),
  ('00000000-0000-0000-0000-0000000000cb', '00000000-0000-0000-0000-00000000000b', 'Test Owl', 2017);

-- Parent A
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.missions (child_id, mission_key)
     values ('00000000-0000-0000-0000-0000000000ca', 'wellbeing_01') $$,
  'a parent adds a mission for their own child'
);
select results_eq(
  $$ select parent_id, chosen_by, status, done_at is null from public.missions $$,
  $$ values ('00000000-0000-0000-0000-00000000000a'::uuid, 'parent'::text, 'todo'::text, true) $$,
  'a new mission belongs to the parent, is chosen by the parent and is not done'
);
select throws_ok(
  $$ insert into public.missions (child_id, mission_key) values ('00000000-0000-0000-0000-0000000000cb', 'wellbeing_01') $$,
  '23503', null, 'no mission for another parent''s child'
);
select throws_ok(
  $$ insert into public.missions (child_id, mission_key, chosen_by) values ('00000000-0000-0000-0000-0000000000ca', 'wellbeing_01', 'professional') $$,
  '42501', null, 'chosen_by cannot be written (NFR-52)'
);
select throws_ok(
  $$ insert into public.missions (child_id, mission_key, status) values ('00000000-0000-0000-0000-0000000000ca', 'wellbeing_01', 'done') $$,
  '42501', null, 'a mission cannot be created already done'
);
select throws_ok(
  $$ insert into public.missions (child_id, mission_key) values ('00000000-0000-0000-0000-0000000000ca', 'Not A Key!') $$,
  '23514', null, 'a malformed mission_key is refused'
);

update public.missions set status = 'done' where mission_key = 'wellbeing_01';
select ok((select done_at is not null from public.missions where mission_key = 'wellbeing_01'), 'marking done records done_at');
update public.missions set status = 'todo' where mission_key = 'wellbeing_01';
select ok((select done_at is null from public.missions where mission_key = 'wellbeing_01'), 'marking not done clears done_at');
select throws_ok(
  $$ update public.missions set done_at = now() where mission_key = 'wellbeing_01' $$,
  '42501', null, 'done_at cannot be written directly'
);
select throws_ok(
  $$ update public.missions set mission_key = 'wellbeing_02' where mission_key = 'wellbeing_01' $$,
  '42501', null, 'mission_key cannot be changed after creation'
);
reset role;

-- Parent B
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}';
select is_empty($$ select 1 from public.missions $$, 'parent B sees no mission of parent A');
select results_eq(
  $$ with u as (update public.missions set status = 'done' returning 1) select count(*)::int from u $$,
  array[0], 'parent B cannot change a mission of parent A'
);
select results_eq(
  $$ with d as (delete from public.missions returning 1) select count(*)::int from d $$,
  array[0], 'parent B cannot delete a mission of parent A'
);
reset role;

set local role anon;
select throws_ok($$ select * from public.missions $$, '42501', null, 'anon cannot read missions');
reset role;

-- Parent A deletes one mission, then the child.
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
insert into public.missions (child_id, mission_key) values ('00000000-0000-0000-0000-0000000000ca', 'wellbeing_02');
select results_eq(
  $$ with d as (delete from public.missions where mission_key = 'wellbeing_02' returning 1) select count(*)::int from d $$,
  array[1], 'a parent deletes their own mission'
);
delete from public.children where id = '00000000-0000-0000-0000-0000000000ca';
reset role;
select is_empty($$ select 1 from public.missions where child_id = '00000000-0000-0000-0000-0000000000ca' $$, 'FR-41: no mission left for the deleted child');
select results_eq($$ select count(*)::int from public.missions $$, array[0], 'no mission left at all');

select * from finish();
rollback;
