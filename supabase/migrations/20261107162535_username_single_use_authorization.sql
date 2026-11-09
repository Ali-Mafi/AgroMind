begin;
-- Standalone F03 fix. No PR #52 or password/session/email schema dependency.
create table private.username_change_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  factor_id uuid not null,
  target_username text not null check (target_username ~ '^[a-z0-9_]{6,30}$'),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default clock_timestamp()+interval '2 minutes',
  verified_at timestamptz,
  consumed_at timestamptz,
  proof_hash text check (proof_hash ~ '^[a-f0-9]{64}$')
);
create index username_change_user_created on private.username_change_grants(user_id,created_at);
create table private.username_change_audit (
  grant_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  factor_id uuid not null,
  previous_username text,
  target_username text not null,
  created_at timestamptz not null default clock_timestamp()
);
create index username_change_audit_user_created on private.username_change_audit(user_id,created_at);
alter table private.username_change_grants enable row level security;
alter table private.username_change_audit enable row level security;
revoke all on private.username_change_grants,private.username_change_audit from public,anon,authenticated,service_role;

create function private.username_grant_context(p_user uuid,p_session uuid,p_factor uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=p_session and s.user_id=p_user and u.email_confirmed_at is not null
    and (s.not_after is null or s.not_after>now()))
  and exists(select 1 from auth.mfa_factors where id=p_factor and user_id=p_user and factor_type='totp' and status='verified');
$$;
revoke all on function private.username_grant_context(uuid,uuid,uuid) from public,anon,authenticated;

create function public.username_reserve_grant(p_user uuid,p_session uuid,p_factor uuid,p_username text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare grant_id uuid; target text := lower(btrim(coalesce(p_username,'')));
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,174));
  if not private.username_grant_context(p_user,p_session,p_factor) then raise exception 'AUTH_REQUIRED'; end if;
  if target !~ '^[a-z0-9_]{6,30}$' then raise exception using errcode='22023',message='INVALID_USERNAME'; end if;
  delete from private.username_change_audit where user_id=p_user and created_at<now()-interval '90 days';
  delete from private.username_change_grants where user_id=p_user and created_at<now()-interval '1 day';
  if (select count(*) from private.username_change_grants where user_id=p_user and created_at>now()-interval '1 minute')>=5 then raise exception 'TOO_MANY_ATTEMPTS'; end if;
  insert into private.username_change_grants(user_id,session_id,factor_id,target_username)
    values(p_user,p_session,p_factor,target) returning id into grant_id;
  return grant_id;
end $$;
create function public.username_verify_grant(p_id uuid,p_user uuid,p_session uuid,p_factor uuid,p_proof_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare g private.username_change_grants;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,174));
  select * into g from private.username_change_grants where id=p_id for update;
  if not found or g.user_id is distinct from p_user or g.session_id is distinct from p_session or g.factor_id is distinct from p_factor
    or g.expires_at<=clock_timestamp() or g.verified_at is not null or g.consumed_at is not null
    or not private.username_grant_context(p_user,p_session,p_factor) then raise exception 'AUTHORIZATION_REQUIRED'; end if;
  if p_proof_hash is null or p_proof_hash !~ '^[a-f0-9]{64}$' then raise exception 'PROOF_REQUIRED'; end if;
  if exists(select 1 from private.username_change_grants where user_id=p_user and proof_hash=p_proof_hash and verified_at>clock_timestamp()-interval '2 minutes') then raise exception 'PROOF_REPLAY'; end if;
  update private.username_change_grants set verified_at=clock_timestamp(),proof_hash=p_proof_hash where id=g.id;
  return true;
end $$;
revoke all on function public.username_reserve_grant(uuid,uuid,uuid,text),public.username_verify_grant(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.username_reserve_grant(uuid,uuid,uuid,text),public.username_verify_grant(uuid,uuid,uuid,uuid,text) to service_role;

-- Retire the legacy entrypoint even for clients retaining its old name/signature.
create or replace function public.change_username(p_username text) returns text
language plpgsql security definer set search_path = '' as $$
begin raise exception 'FRESH_USERNAME_AUTHORIZATION_REQUIRED'; end $$;
revoke all on function public.change_username(text) from public,anon,authenticated,service_role;

create function public.change_username_authorized(p_grant uuid,p_username text) returns text
language plpgsql security definer set search_path = '' as $$
declare g private.username_change_grants; subject uuid := auth.uid(); session uuid; previous text;
  target text := lower(btrim(coalesce(p_username,'')));
begin
  if subject is null or not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  begin session := (auth.jwt()->>'session_id')::uuid; exception when invalid_text_representation then raise exception 'AUTH_REQUIRED'; end;
  if session is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'MFA_CHALLENGE_REQUIRED'; end if;
  if target !~ '^[a-z0-9_]{6,30}$' then raise exception using errcode='22023',message='INVALID_USERNAME'; end if;
  select * into g from private.username_change_grants where id=p_grant for update;
  if not found or g.user_id<>subject or g.session_id<>session or g.target_username<>target or g.verified_at is null
    or g.consumed_at is not null or g.expires_at<=clock_timestamp()
    or not private.username_grant_context(subject,session,g.factor_id) then raise exception 'FRESH_USERNAME_AUTHORIZATION_REQUIRED'; end if;
  select username into previous from public.profiles where id=subject for update;
  if not found then raise exception 'AUTH_REQUIRED'; end if;
  begin
    update public.profiles set username=target where id=subject;
  exception when unique_violation then raise exception using errcode='23505',message='USERNAME_TAKEN'; end;
  -- Mutation, grant consumption and audit either all commit or all roll back.
  update private.username_change_grants set consumed_at=clock_timestamp() where id=g.id;
  insert into private.username_change_audit(grant_id,user_id,session_id,factor_id,previous_username,target_username)
    values(g.id,subject,session,g.factor_id,previous,target);
  return target;
end $$;
revoke all on function public.change_username_authorized(uuid,text) from public,anon,service_role;
grant execute on function public.change_username_authorized(uuid,text) to authenticated;

commit;
