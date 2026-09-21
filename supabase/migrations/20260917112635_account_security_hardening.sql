-- Additive hardening: provider-owned sessions/factors are only read, never edited.
create or replace function private.session_is_active() returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare subject uuid := auth.uid(); session_id uuid;
begin
  if subject is null then return false; end if;
  begin session_id := (auth.jwt()->>'session_id')::uuid;
  exception when invalid_text_representation then return false; end;
  if session_id is null then return false; end if;
  return exists (select 1 from auth.sessions s where s.id = session_id
    and s.user_id = subject and (s.not_after is null or s.not_after > now()));
end $$;
revoke all on function private.session_is_active() from public, anon, authenticated;

create or replace function private.is_verified() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.session_is_active() and exists
    (select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null)
$$;

create or replace function private.mfa_access_allowed() returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare subject uuid := auth.uid(); factor_enabled boolean;
begin
  if not private.session_is_active() then return false; end if;
  -- Missing Auth infrastructure denies access; it never disables MFA enforcement.
  if to_regclass('auth.mfa_factors') is null then return false; end if;
  select exists (select 1 from auth.mfa_factors where user_id = subject and status = 'verified')
    into factor_enabled;
  return not factor_enabled or coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2';
end $$;

-- Minimal metadata for this actual session, not a fabricated device inventory.
create function public.get_current_session() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('created_at',s.created_at)
  from auth.sessions s where private.session_is_active()
    and s.id::text = auth.jwt()->>'session_id' and s.user_id = auth.uid()
$$;
revoke all on function public.get_current_session() from public, anon;
grant execute on function public.get_current_session() to authenticated;

create table private.username_login_limits (
  bucket text primary key,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
alter table private.username_login_limits enable row level security;
revoke all on private.username_login_limits from public, anon, authenticated;

-- Only the Edge Function's server credential may consume limits. HMAC identifiers
-- avoid storing usernames or IP addresses. A global budget bounds unique-key abuse.
create function public.consume_username_login_attempt(p_identifier_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if p_identifier_hash is null or p_identifier_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  delete from private.username_login_limits where expires_at <= now();
  insert into private.username_login_limits values ('global',1,now()+interval '5 minutes')
    on conflict(bucket) do update set attempts = private.username_login_limits.attempts+1
    returning attempts into n;
  if n > 300 then return false; end if;
  insert into private.username_login_limits values ('user:'||p_identifier_hash,1,now()+interval '10 minutes')
    on conflict(bucket) do update set attempts = private.username_login_limits.attempts+1
    returning attempts into n;
  return n <= 10;
end $$;
revoke all on function public.consume_username_login_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_username_login_attempt(text) to service_role;
