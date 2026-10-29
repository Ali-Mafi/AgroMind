-- PR #52 follow-up: persistent pre-provider credential denial, session status, and reauth quota.
-- Forward-only. Do not mutate Supabase-owned auth tables or remove existing denial history.
begin;

alter table private.security_revocations add column password_result text
  check (password_result in ('pending','confirmed','rejected'));

-- Consume the credential proof and deny the native session snapshot atomically BEFORE
-- any external password mutation. If this transaction fails, Auth must not be called.
create function private.security_prepare_password_change(
  p_id uuid,p_user uuid,p_session uuid,p_operation text,p_payload_hash text
) returns boolean language plpgsql security definer set search_path='' as $$
declare g private.security_action_grants; targets_snapshot uuid[];
begin
  if p_operation not in ('password_change','password_recovery') then
    raise exception 'SECURITY_DENIED';
  end if;
  perform private.security_consume_action(p_id,p_user,p_session,p_operation,p_payload_hash);
  select * into g from private.security_action_grants
    where id=p_id and user_id=p_user and session_id=p_session and state='consumed' for update;
  if not found then raise exception 'SECURITY_DENIED'; end if;
  select coalesce(array_agg(id),'{}'::uuid[]) into targets_snapshot
    from auth.sessions where user_id=p_user;
  if not (p_session=any(targets_snapshot)) then raise exception 'SECURITY_DENIED'; end if;
  insert into private.security_revocations
    (id,user_id,session_id,factor_id,scope,proof_hash,state,consumed_at,targets,password_result)
    values (p_id,p_user,p_session,g.factor_id,'global',g.proof_hash,
      'executing',now(),targets_snapshot,'pending');
  insert into private.security_denied_sessions(session_id,user_id)
    select unnest(targets_snapshot),p_user on conflict do nothing;
  insert into private.security_events(user_id,session_id,kind,event_key,details)
    values(p_user,p_session,'revocation_requested','revoke-request:'||p_id,
      jsonb_build_object('scope','global','count',cardinality(targets_snapshot),
        'authorization',g.operation,'provider_outcome','pending'));
  return true;
end $$;

create function public.security_prepare_password_change(
  p_id uuid,p_user uuid,p_session uuid,p_operation text,p_payload_hash text
) returns boolean language sql security invoker set search_path='' as $$
  select private.security_prepare_password_change(p_id,p_user,p_session,p_operation,p_payload_hash)
$$;
revoke all on function private.security_prepare_password_change(uuid,uuid,uuid,text,text),
  public.security_prepare_password_change(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.security_prepare_password_change(uuid,uuid,uuid,text,text),
  public.security_prepare_password_change(uuid,uuid,uuid,text,text) to service_role;

-- The legacy after-update recorder may only confirm an ALREADY PREPARED operation.
-- Never manufacture session denials after an irreversible password update.
create or replace function private.security_password_changed(
  p_id uuid,p_user uuid,p_session uuid
) returns void language plpgsql security definer set search_path='' as $$
declare prior_result text;
begin
  select password_result into prior_result from private.security_revocations
    where id=p_id and user_id=p_user and session_id=p_session and scope='global'
      and consumed_at is not null for update;
  if not found or prior_result not in ('pending','confirmed') then
    raise exception 'SECURITY_UNPREPARED_PASSWORD_CHANGE';
  end if;
  update private.security_revocations set password_result='confirmed'
    where id=p_id and user_id=p_user and session_id=p_session;
  insert into private.security_events(user_id,session_id,kind,event_key)
    values(p_user,p_session,'password_changed','password-grant:'||p_id)
    on conflict(user_id,event_key) do nothing;
end $$;

create function private.security_password_update_rejected(
  p_id uuid,p_user uuid,p_session uuid
) returns void language plpgsql security definer set search_path='' as $$
begin
  update private.security_revocations set password_result='rejected'
    where id=p_id and user_id=p_user and session_id=p_session
      and password_result in ('pending','rejected');
  if not found then raise exception 'SECURITY_UNPREPARED_PASSWORD_CHANGE'; end if;
  insert into private.security_events(user_id,session_id,kind,event_key)
    values(p_user,p_session,'password_update_rejected','password-rejected:'||p_id)
    on conflict(user_id,event_key) do nothing;
end $$;
create function public.security_password_update_rejected(
  p_id uuid,p_user uuid,p_session uuid
) returns void language sql security invoker set search_path='' as $$
  select private.security_password_update_rejected(p_id,p_user,p_session)
$$;
revoke all on function private.security_password_update_rejected(uuid,uuid,uuid),
  public.security_password_update_rejected(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function private.security_password_update_rejected(uuid,uuid,uuid),
  public.security_password_update_rejected(uuid,uuid,uuid) to service_role;

-- Read-only, operation-scoped recovery lookup for uncertain consume responses.
create function private.security_revocation_status(
  p_id uuid,p_user uuid,p_session uuid
) returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('state',r.state,'scope',r.scope,
    'consumed',r.consumed_at is not null)
  from private.security_revocations r
  where r.id=p_id and r.user_id=p_user and r.session_id=p_session
$$;
create function public.security_revocation_status(
  p_id uuid,p_user uuid,p_session uuid
) returns jsonb language sql security invoker set search_path='' as $$
  select private.security_revocation_status(p_id,p_user,p_session)
$$;
revoke all on function private.security_revocation_status(uuid,uuid,uuid),
  public.security_revocation_status(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function private.security_revocation_status(uuid,uuid,uuid),
  public.security_revocation_status(uuid,uuid,uuid) to service_role;

-- Single row per user: bounded cooldown and 5 sends per 10 minutes.
create table private.security_reauthentication_quota (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  window_started_at timestamptz not null,
  last_sent_at timestamptz not null,
  attempts integer not null check(attempts between 1 and 5)
);
alter table private.security_reauthentication_quota enable row level security;
revoke all on private.security_reauthentication_quota from public,anon,authenticated;

create function private.security_reserve_reauthentication(
  p_user uuid,p_session uuid
) returns boolean language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
  if not private.security_owned_session(p_user,p_session) then
    raise exception 'SECURITY_DENIED';
  end if;
  insert into private.security_reauthentication_quota
    (user_id,session_id,window_started_at,last_sent_at,attempts)
    values(p_user,p_session,now(),now(),1)
  on conflict(user_id) do update
    set session_id=excluded.session_id,
        last_sent_at=now(),
        window_started_at=case
          when private.security_reauthentication_quota.window_started_at<=now()-interval '10 minutes'
            then now()
          else private.security_reauthentication_quota.window_started_at end,
        attempts=case
          when private.security_reauthentication_quota.window_started_at<=now()-interval '10 minutes'
            then 1
          else private.security_reauthentication_quota.attempts+1 end
    where private.security_reauthentication_quota.last_sent_at<=now()-interval '60 seconds'
      and (private.security_reauthentication_quota.window_started_at<=now()-interval '10 minutes'
        or private.security_reauthentication_quota.attempts<5);
  if not found then raise exception 'SECURITY_REAUTH_RATE_LIMIT'; end if;
  return true;
end $$;
create function public.security_reserve_reauthentication(
  p_user uuid,p_session uuid
) returns boolean language sql security invoker set search_path='' as $$
  select private.security_reserve_reauthentication(p_user,p_session)
$$;
revoke all on function private.security_reserve_reauthentication(uuid,uuid),
  public.security_reserve_reauthentication(uuid,uuid) from public,anon,authenticated;
grant execute on function private.security_reserve_reauthentication(uuid,uuid),
  public.security_reserve_reauthentication(uuid,uuid) to service_role;

commit;
