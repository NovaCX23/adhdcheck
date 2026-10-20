-- FR-70: the parent's camera and microphone choices, made on their own device before play, travel with the
-- play link to the child's tablet. Both are off unless the parent switches them on; nothing is captured here,
-- the game only reads the choice (camera and microphone features stay on the device, FR-71 to FR-74).

alter table public.play_links
  add column allow_camera boolean not null default false,
  add column allow_microphone boolean not null default false;

-- issue_play_link gains the two choices, defaulting to off for callers that do not pass them.
drop function public.issue_play_link(uuid, uuid, text, timestamptz);

create function public.issue_play_link(
  p_parent_id uuid,
  p_child_id uuid,
  p_code_hash text,
  p_expires_at timestamptz,
  p_allow_camera boolean default false,
  p_allow_microphone boolean default false
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.play_links (code_hash, child_id, parent_id, expires_at, allow_camera, allow_microphone)
  select p_code_hash, c.id, c.parent_id, p_expires_at, coalesce(p_allow_camera, false), coalesce(p_allow_microphone, false)
  from public.children c
  where c.id = p_child_id and c.parent_id = p_parent_id;
  return found;
end;
$$;

-- resolve_play_link now answers the choices with the child: one row for a link that exists, has not expired
-- and is not used up; no row otherwise.
drop function public.resolve_play_link(text);

create function public.resolve_play_link(p_code_hash text)
returns table (child_id uuid, allow_camera boolean, allow_microphone boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.child_id, l.allow_camera, l.allow_microphone
  from public.play_links l
  where l.code_hash = p_code_hash and l.expires_at > now() and l.session_id is null;
$$;

revoke execute on function public.issue_play_link(uuid, uuid, text, timestamptz, boolean, boolean) from public, anon, authenticated;
revoke execute on function public.resolve_play_link(text) from public, anon, authenticated;
grant execute on function public.issue_play_link(uuid, uuid, text, timestamptz, boolean, boolean) to service_role; -- check-secrets: allow
grant execute on function public.resolve_play_link(text) to service_role; -- check-secrets: allow
