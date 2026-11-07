begin;
-- Isolated reset authorization. No PR #52/session/email migration dependency.
create table private.password_recovery_tickets (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique,
  expires_at timestamptz not null default clock_timestamp() + interval '10 minutes',
  consumed_at timestamptz
);
create table private.password_action_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  operation text not null check (operation in ('password_change','password_recovery','password_reauthentication')),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  requires_mfa boolean not null,
  recovery_hash text,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp() + interval '2 minutes',
  consumed_at timestamptz,
  proof_hash text
);
create index password_action_user_created on private.password_action_grants(user_id, created_at);
alter table private.password_recovery_tickets enable row level security;
alter table private.password_action_grants enable row level security;
revoke all on private.password_recovery_tickets, private.password_action_grants from public, anon, authenticated, service_role;

create function private.password_session_valid(p_user uuid, p_session uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=p_session and s.user_id=p_user and u.email_confirmed_at is not null
    and (s.not_after is null or s.not_after>now()));
$$;
revoke all on function private.password_session_valid(uuid,uuid) from public, anon, authenticated;

create function public.password_issue_recovery(p_user uuid,p_session uuid,p_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not private.password_session_valid(p_user,p_session) then raise exception 'AUTH_REQUIRED'; end if;
  insert into private.password_recovery_tickets(token_hash,user_id,session_id) values(p_hash,p_user,p_session);
  return true;
end $$;
create function public.password_has_recovery(p_user uuid,p_session uuid,p_hash text) returns boolean
language sql security definer set search_path = '' as $$
  select private.password_session_valid(p_user,p_session) and exists(
    select 1 from private.password_recovery_tickets where token_hash=p_hash and user_id=p_user
      and session_id=p_session and consumed_at is null and expires_at>clock_timestamp());
$$;
create function public.password_reserve(p_user uuid,p_session uuid,p_operation text,p_payload_hash text,p_recovery_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g private.password_action_grants; mfa boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,173));
  if not private.password_session_valid(p_user,p_session) then raise exception 'AUTH_REQUIRED'; end if;
  -- Retain consumed receipts for one day; never persist secrets or password hashes without a server HMAC.
  delete from private.password_action_grants where user_id=p_user and created_at<now()-interval '1 day';
  delete from private.password_recovery_tickets where user_id=p_user and expires_at<now()-interval '1 day';
  if (select count(*) from private.password_action_grants where user_id=p_user and created_at>now()-interval '1 minute')>=5 then
    raise exception 'TOO_MANY_ATTEMPTS';
  end if;
  if p_operation is null then raise exception 'WRONG_OPERATION'; end if;
  if p_operation='password_recovery' then
    if not public.password_has_recovery(p_user,p_session,p_recovery_hash) then raise exception 'RECOVERY_REQUIRED'; end if;
  elsif p_operation not in ('password_change','password_reauthentication') or p_recovery_hash is not null then raise exception 'WRONG_OPERATION'; end if;
  select exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified') into mfa;
  insert into private.password_action_grants(user_id,session_id,operation,payload_hash,requires_mfa,recovery_hash)
    values(p_user,p_session,p_operation,p_payload_hash,mfa,p_recovery_hash) returning * into g;
  return jsonb_build_object('id',g.id,'requires_mfa',mfa);
end $$;
create function public.password_consume(p_id uuid,p_user uuid,p_session uuid,p_operation text,p_payload_hash text,
  p_method text,p_factor uuid,p_proof_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare g private.password_action_grants; mfa boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,173));
  select * into g from private.password_action_grants where id=p_id for update;
  if not found or g.user_id is distinct from p_user or g.session_id is distinct from p_session or g.operation is distinct from p_operation
    or g.payload_hash is distinct from p_payload_hash or g.expires_at<=clock_timestamp() or g.consumed_at is not null
    or not private.password_session_valid(p_user,p_session) then raise exception 'AUTHORIZATION_REQUIRED'; end if;
  select exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified') into mfa;
  if mfa<>g.requires_mfa then raise exception 'FACTOR_STATE_CHANGED'; end if;
  if g.operation='password_reauthentication' then raise exception 'WRONG_OPERATION'; end if;
  if p_method is null then raise exception 'PROOF_REQUIRED'; end if;
  if g.requires_mfa then
    if p_method='totp' then
      if not exists(select 1 from auth.mfa_factors where id=p_factor and user_id=p_user and status='verified' and factor_type='totp') then
        raise exception 'FACTOR_REQUIRED'; end if;
    elsif p_method<>'backup' or p_factor is not null then raise exception 'MFA_REQUIRED'; end if;
  elsif not ((g.operation='password_recovery' and p_method='email') or (g.operation='password_change' and p_method='password')) then
    raise exception 'PROOF_REQUIRED';
  end if;
  if p_proof_hash is null or p_proof_hash !~ '^[a-f0-9]{64}$' then raise exception 'PROOF_REQUIRED'; end if;
  if p_method in ('totp','backup') and exists(select 1 from private.password_action_grants
    where user_id=p_user and proof_hash=p_proof_hash and consumed_at>clock_timestamp()-interval '2 minutes') then
    raise exception 'PROOF_REPLAY';
  end if;
  if g.operation='password_recovery' then
    update private.password_recovery_tickets set consumed_at=clock_timestamp()
      where token_hash=g.recovery_hash and user_id=p_user and session_id=p_session
      and consumed_at is null and expires_at>clock_timestamp();
    if not found then raise exception 'RECOVERY_REQUIRED'; end if;
  end if;
  update private.password_action_grants set consumed_at=clock_timestamp(),proof_hash=p_proof_hash where id=g.id;
  return true;
end $$;
-- These are server-only attestation endpoints. Identity comes from getUser + JWT-backed
-- get_current_session in the trusted server, then is rechecked against native rows here.
revoke all on function public.password_issue_recovery(uuid,uuid,text), public.password_has_recovery(uuid,uuid,text),
  public.password_reserve(uuid,uuid,text,text,text), public.password_consume(uuid,uuid,uuid,text,text,text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.password_issue_recovery(uuid,uuid,text), public.password_has_recovery(uuid,uuid,text),
  public.password_reserve(uuid,uuid,text,text,text), public.password_consume(uuid,uuid,uuid,text,text,text,uuid,text)
  to service_role;

commit;
