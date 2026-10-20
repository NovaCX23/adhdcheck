-- Demo seed (FR-55) and Reset demo (FR-56): seed_demo(parent) replaces that parent's children with one
-- synthetic child and 12 scored sessions over the last 4 weeks. Running it again gives the same data.
-- Called by POST /api/demo/reset through the service role only (NFR-12), for the demo account only.
--
-- ALL VALUES ARE SYNTHETIC DEMO DATA, not measurements and not thresholds. The scores are written here
-- because the scorer is still a stub; regenerate them with the real scorer once it exists.
-- Indicators vary around fixed values with no trend over time, so the chart implies no improvement.
-- Flags are copied from the ScoreResult example (docs/02 section 7.2). The reason lines are user-visible
-- text: placeholders until Person 4 supplies the wording.

create function public.seed_demo(p_parent_id uuid)
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
        then array['TODO (Person 4): reason line for high_rt_variability', 'TODO (Person 4): reason line for high_commission_rate']
        else array[]::text[] end,
      array[]::text[],
      'Attention profile from a game. Not a diagnosis. Talk to a healthcare professional.'
    );
  end loop;

  return array_length(v_days, 1);
end;
$$;

revoke execute on function public.seed_demo(uuid) from public, anon, authenticated;
grant execute on function public.seed_demo(uuid) to service_role; -- check-secrets: allow
