-- FR-70: the parent's camera and microphone choices travel with the play link, off unless the parent
-- switched them on. Run with: npx supabase@latest test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'parent-a@example.test');
insert into public.children (id, parent_id, nickname, birth_year) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-00000000000a', 'Test Fox', 2018);

select col_default_is('public', 'play_links', 'allow_camera', 'false', 'camera is off by default');
select col_default_is('public', 'play_links', 'allow_microphone', 'false', 'microphone is off by default');
select col_not_null('public', 'play_links', 'allow_camera', 'camera choice is never unknown');

set local role service_role; -- check-secrets: allow
-- Without the choice arguments (older callers): both off.
select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ca', repeat('a', 64), now() + interval '1 hour');
select results_eq(
  $$ select child_id, allow_camera, allow_microphone from public.resolve_play_link(repeat('a', 64)) $$,
  $$ values ('00000000-0000-0000-0000-0000000000ca'::uuid, false, false) $$,
  'a link issued without choices resolves with both off'
);

-- Microphone only.
select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ca', repeat('b', 64), now() + interval '1 hour', false, true);
select results_eq(
  $$ select child_id, allow_camera, allow_microphone from public.resolve_play_link(repeat('b', 64)) $$,
  $$ values ('00000000-0000-0000-0000-0000000000ca'::uuid, false, true) $$,
  'each choice is kept separately'
);
select is_empty($$ select * from public.resolve_play_link(repeat('c', 64)) $$, 'an unknown link resolves to no row');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';
select throws_ok(
  $$ select public.issue_play_link('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000ca', repeat('d', 64), now() + interval '1 hour', true, true) $$,
  '42501', null, 'a parent cannot issue a link directly, with or without choices'
);
reset role;

select * from finish();
rollback;
