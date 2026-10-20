-- Missions (FR-37, FR-38): general wellbeing activities the parent chooses for a child, marked done or not.
-- NFR-52 (Rule 22): missions are never selected from the score. chosen_by is not writable by anyone
-- through the API: it is always 'parent' until a professional flow exists. No function reads scores here.
-- Parents write their own rows directly (RLS): insert only child_id and mission_key, update only status.
-- done_at is set by a trigger when status becomes 'done' and cleared when it goes back to 'todo'.
-- FR-41: deleting a child deletes its missions. The catalogue (keys and texts) lives in apps/web/lib/missions.ts.
--
-- Also replaces seed_demo (FR-55): the demo child gets six missions, and the reason lines are now the
-- sentences from research/04 section 7.3 (pending review by the texts owner) instead of placeholders.

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null,
  parent_id uuid not null default auth.uid(),
  mission_key text not null check (mission_key ~ '^[a-z0-9_]{1,64}$'),
  chosen_by text not null default 'parent' check (chosen_by in ('parent', 'professional')),
  status text not null default 'todo' check (status in ('todo', 'done')),
  created_at timestamptz not null default now(),
  done_at timestamptz,
  check ((status = 'done') = (done_at is not null)),
  foreign key (child_id, parent_id) references public.children (id, parent_id) on delete cascade
);

create index missions_parent_id_idx on public.missions (parent_id);
create index missions_child_id_idx on public.missions (child_id);

create function public.missions_set_done_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'todo' then
    new.done_at := null;
  elsif new.done_at is null then
    new.done_at := now();
  end if;
  return new;
end;
$$;

create trigger missions_set_done_at
  before insert or update of status on public.missions
  for each row execute function public.missions_set_done_at();

revoke all on public.missions from anon, authenticated;
grant select, delete on public.missions to authenticated;
grant insert (child_id, mission_key), update (status) on public.missions to authenticated;
grant select, insert, update, delete on public.missions to service_role; -- check-secrets: allow

alter table public.missions enable row level security;

create policy "missions_select_own" on public.missions
  for select to authenticated using (parent_id = (select auth.uid()));
create policy "missions_insert_own" on public.missions
  for insert to authenticated with check (parent_id = (select auth.uid()));
create policy "missions_update_own" on public.missions
  for update to authenticated using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
create policy "missions_delete_own" on public.missions
  for delete to authenticated using (parent_id = (select auth.uid()));

create or replace function public.seed_demo(p_parent_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_child_id uuid;
  v_days integer[] := array[27, 25, 23, 20, 18, 16, 13, 11, 9, 6, 4, 2];
  v_short integer := 5; -- this session ended early and scores insufficient_data
  v_session_id uuid;
  v_i integer;
  v_full boolean;
  v_mean numeric;
  v_sd numeric;
  v_mission integer;
begin
  delete from public.children where parent_id = p_parent_id;

  insert into public.children (parent_id, nickname, birth_year)
  values (p_parent_id, 'Demo Fox', 2018)
  returning id into v_child_id;

  for v_i in 1 .. array_length(v_days, 1) loop
    v_session_id := gen_random_uuid();
    v_full := v_i <> v_short;
    v_mean := round(520 + 30 * sin(v_i * 1.7)::numeric);
    v_sd := round(140 + 15 * sin(v_i * 1.1)::numeric);

    insert into public.sessions (id, child_id, parent_id, started_at, duration_ms, task, device, calibration, off_target_taps, schema_version)
    values (
      v_session_id,
      v_child_id,
      p_parent_id,
      (current_date - v_days[v_i]) + time '16:30',
      case when v_full then 300000 else 60000 end,
      jsonb_build_object('type', 'go_nogo', 'version', '0.1.0', 'blocks', 3, 'go_probability', 0.8, 'stimulus_ms', 500,
                         'isi_ms_min', 900, 'isi_ms_max', 1500, 'calibration_trials', 10),
      jsonb_build_object('user_agent', 'synthetic-demo-agent', 'pointer_type', 'touch', 'screen_w', 1024, 'screen_h', 768,
                         'device_pixel_ratio', 1, 'est_refresh_hz', 60, 'cross_origin_isolated', false,
                         'timer_clock', 'event.timeStamp'),
      jsonb_build_object('median_rt_ms', v_mean - 40, 'n', 10),
      '[]'::jsonb,
      '1.0'
    );

    insert into public.scores (session_id, parent_id, scoring_method, validated, indicators, flags, band, data_quality, reasons, recommendations, disclaimer)
    values (
      v_session_id,
      p_parent_id,
      'rules_v0',
      false,
      jsonb_build_object(
        'omission_rate', round(0.06 + 0.02 * sin(v_i * 1.3)::numeric, 3),
        'commission_rate', round(0.22 + 0.04 * sin(v_i * 2.3)::numeric, 3),
        'rt_mean_ms', v_mean,
        'rt_sd_ms', v_sd,
        'rt_cv', round(v_sd / v_mean, 3),
        'vigilance_change', round(0.08 + 0.03 * sin(v_i * 0.9)::numeric, 3),
        'off_target_tap_rate', round(0.12 + 0.03 * sin(v_i * 1.5)::numeric, 3)
      ),
      case when v_full then array['high_rt_variability', 'high_commission_rate'] else array[]::text[] end,
      case when v_full then 'follow_up_suggested' else 'insufficient_data' end,
      jsonb_build_object('n_trials', case when v_full then 144 else 30 end, 'pct_anticipations', 0.01, 'notes', '[]'::jsonb),
      case when v_full
        then array['Response speed varied more than expected during the watch.', 'Tapped often when the game asked to wait.']
        else array[]::text[] end,
      array[]::text[],
      'Attention profile from a game. Not a diagnosis. Talk to a healthcare professional.'
    );
  end loop;

  -- Six parent-chosen missions over the 4 weeks, the first four done (keys from apps/web/lib/missions.ts).
  for v_mission in 1 .. 6 loop
    insert into public.missions (child_id, parent_id, mission_key, status, created_at, done_at)
    values (
      v_child_id,
      p_parent_id,
      'wellbeing_0' || v_mission,
      case when v_mission <= 4 then 'done' else 'todo' end,
      (current_date - (28 - 4 * v_mission)) + time '19:00',
      case when v_mission <= 4 then (current_date - (28 - 4 * v_mission - 2)) + time '19:00' end
    );
  end loop;

  return array_length(v_days, 1);
end;
$$;
