-- save_session: store one SessionMetrics v1 (with its trials) and its ScoreResult v1 in one transaction.
-- Called by POST /api/sessions through the service role only (NFR-12); the payloads were validated
-- against the contracts before the call. parent_id is copied from the child row, never taken from
-- the payload. Returns 'created', 'duplicate' (same session_id already stored, FR-12) or 'unknown_child'.

create function public.save_session(p_session jsonb, p_score jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid := (p_session ->> 'session_id')::uuid;
  v_parent_id uuid;
  v_inserted integer;
begin
  select c.parent_id into v_parent_id
  from public.children c
  where c.id = (p_session ->> 'child_id')::uuid;

  if v_parent_id is null then
    return 'unknown_child';
  end if;

  insert into public.sessions (id, child_id, parent_id, started_at, duration_ms, task, device, calibration, off_target_taps, schema_version)
  values (
    v_session_id,
    (p_session ->> 'child_id')::uuid,
    v_parent_id,
    (p_session ->> 'started_at')::timestamptz,
    (p_session ->> 'duration_ms')::double precision,
    p_session -> 'task',
    p_session -> 'device',
    p_session -> 'calibration',
    p_session -> 'off_target_taps',
    p_session ->> 'schema_version'
  )
  on conflict (id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 'duplicate';
  end if;

  insert into public.trials (session_id, parent_id, i, block, type, stimulus_onset_ms, responded, rt_ms, outcome, x, y)
  select v_session_id, v_parent_id, t.i, t.block, t.type, t.stimulus_onset_ms, t.responded, t.rt_ms, t.outcome, t.x, t.y
  from jsonb_to_recordset(p_session -> 'trials') as t (
    i integer, block integer, type text, stimulus_onset_ms double precision, responded boolean,
    rt_ms double precision, outcome text, x double precision, y double precision
  );

  insert into public.scores (session_id, parent_id, scoring_method, validated, indicators, flags, band, data_quality, reasons, recommendations, disclaimer)
  values (
    v_session_id,
    v_parent_id,
    p_score ->> 'scoring_method',
    (p_score ->> 'validated')::boolean,
    p_score -> 'indicators',
    array(select jsonb_array_elements_text(p_score -> 'flags')),
    p_score ->> 'band',
    p_score -> 'data_quality',
    array(select jsonb_array_elements_text(p_score -> 'reasons')),
    array(select jsonb_array_elements_text(p_score -> 'recommendations')),
    p_score ->> 'disclaimer'
  );

  return 'created';
end;
$$;

revoke execute on function public.save_session(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_session(jsonb, jsonb) to service_role; -- check-secrets: allow
