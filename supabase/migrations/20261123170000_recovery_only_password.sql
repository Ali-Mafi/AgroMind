begin;

create table private.password_recovery_attempts (
  capability_hash text primary key check (capability_hash ~ '^[0-9a-f]{64}$'),
  email_proof_hash text not null unique check (email_proof_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique,
  session_created_at timestamptz not null,
  expires_at timestamptz not null default clock_timestamp() + interval '10 minutes',
  consumed_at timestamptz
);
create index password_recovery_attempts_user on private.password_recovery_attempts(user_id);
alter table private.password_recovery_attempts enable row level security;
revoke all on private.password_recovery_attempts from public, anon, authenticated, service_role;

create function private.password_recovery_session(p_user uuid, p_session uuid)
returns timestamptz
language sql stable security definer set search_path = '' as $$
  select s.created_at
  from auth.sessions s
  join auth.users u on u.id = s.user_id
  where s.id = p_session and s.user_id = p_user and u.email_confirmed_at is not null
    and (s.not_after is null or s.not_after > now());
$$;
revoke all on function private.password_recovery_session(uuid, uuid)
  from public, anon, authenticated, service_role;

create function public.issue_password_recovery(
  p_user uuid, p_session uuid, p_hash text, p_email_proof text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  recovered_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 173));
  recovered_at := private.password_recovery_session(p_user, p_session);
  if recovered_at is null then return false; end if;

  -- Retain used email proofs beyond the maximum signed email lifetime.
  delete from private.password_recovery_attempts
    where user_id = p_user and expires_at <= clock_timestamp() - interval '1 hour';

  if exists (
    select 1 from private.password_recovery_attempts a
    where a.user_id = p_user and a.session_created_at >= recovered_at
  ) then return false; end if;

  insert into private.password_recovery_attempts(
    capability_hash, email_proof_hash, user_id, session_id, session_created_at
  ) values (p_hash, p_email_proof, p_user, p_session, recovered_at)
  on conflict do nothing;
  if not found then return false; end if;

  update private.password_recovery_attempts
    set consumed_at = clock_timestamp()
    where user_id = p_user and session_id <> p_session and consumed_at is null;
  return true;
end;
$$;

create function public.has_password_recovery(p_user uuid, p_session uuid, p_hash text)
returns boolean
language sql security definer set search_path = '' as $$
  select private.password_recovery_session(p_user, p_session) is not null and exists (
    select 1 from private.password_recovery_attempts
    where user_id = p_user and session_id = p_session and capability_hash = p_hash
      and consumed_at is null and expires_at > clock_timestamp()
  );
$$;

create function public.consume_password_recovery(
  p_user uuid, p_session uuid, p_hash text, p_factor uuid default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 173));
  if private.password_recovery_session(p_user, p_session) is null then return false; end if;

  if p_factor is null then
    if exists (select 1 from auth.mfa_factors where user_id = p_user and status = 'verified')
      then return false; end if;
  elsif not exists (
    select 1 from auth.mfa_factors
    where user_id = p_user and id = p_factor and status = 'verified' and factor_type = 'totp'
  ) then return false;
  end if;

  update private.password_recovery_attempts
    set consumed_at = clock_timestamp()
    where user_id = p_user and session_id = p_session and capability_hash = p_hash
      and consumed_at is null and expires_at > clock_timestamp();
  return found;
end;
$$;

revoke all on function public.issue_password_recovery(uuid, uuid, text, text),
  public.has_password_recovery(uuid, uuid, text),
  public.consume_password_recovery(uuid, uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.issue_password_recovery(uuid, uuid, text, text),
  public.has_password_recovery(uuid, uuid, text),
  public.consume_password_recovery(uuid, uuid, text, uuid)
  to service_role;

commit;
