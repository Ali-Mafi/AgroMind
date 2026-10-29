-- PR #52 follow-up: a new revocation must never erase an unresolved password result.
-- This is a forward-only replacement of the existing private reservation function.
-- Retain all previous security grants, denial tombstones, and audit history.
begin;

create or replace function private.security_begin_revocation(
  p_user uuid,p_session uuid,p_factor uuid,p_scope text,p_proof_hash text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare op uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
  if p_scope is null or p_scope not in ('others','global')
    or p_proof_hash is null or p_proof_hash !~ '^[a-f0-9]{64}$'
    then raise exception 'SECURITY_INVALID';
  end if;
  if not exists(
    select 1 from auth.sessions
      where id=p_session and user_id=p_user
        and (not_after is null or not_after>now())
  )
  or exists(
    select 1 from private.security_denied_sessions
      where session_id=p_session
  )
  or not exists(
    select 1 from auth.mfa_factors
      where id=p_factor and user_id=p_user
        and status='verified' and factor_type='totp'
  ) then raise exception 'SECURITY_DENIED';
  end if;

  -- Previous reservation cleanup removed completed password operations after
  -- ten minutes, even while their native password result was still unknown.
  -- Match the retention rule in security_prune: only resolved/non-password
  -- operations may be deleted. Never clear a pending password result.
  delete from private.security_revocations
    where user_id=p_user
      and state in ('failed','completed')
      and created_at<now()-interval '10 minutes'
      and password_result is distinct from 'pending';

  if (select count(*) from private.security_revocations
        where user_id=p_user and created_at>now()-interval '10 minutes')
    + (select count(*) from private.security_action_grants
        where user_id=p_user and created_at>now()-interval '10 minutes') >= 5
    then raise exception 'SECURITY_RATE';
  end if;
  if exists(
    select 1 from private.security_action_grants
      where user_id=p_user and state in ('verifying','verified')
        and expires_at>now()
  ) or exists(
    select 1 from private.security_revocations
      where user_id=p_user and state in ('verifying','executing')
        and expires_at>now()
  ) then raise exception 'SECURITY_BUSY';
  end if;
  if exists(
    select 1 from private.security_action_grants
      where user_id=p_user and proof_hash=p_proof_hash
        and created_at>now()-interval '10 minutes'
  ) or exists(
    select 1 from private.security_revocations
      where user_id=p_user and proof_hash=p_proof_hash
  ) then raise exception 'SECURITY_REPLAY';
  end if;
  insert into private.security_revocations(
    user_id,session_id,factor_id,scope,proof_hash
  ) values (
    p_user,p_session,p_factor,p_scope,p_proof_hash
  ) returning id into op;
  return op;
end $$;

-- Existing grants on this function remain in force under CREATE OR REPLACE.
-- It is an internal, non-exposed, security-definer function.
revoke all on function private.security_begin_revocation(uuid,uuid,uuid,text,text)
  from public,anon,authenticated;
grant execute on function private.security_begin_revocation(uuid,uuid,uuid,text,text)
  to service_role;

commit;
