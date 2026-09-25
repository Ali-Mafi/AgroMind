-- Secure username updates. Existing uniqueness is provided by
-- profiles_username_lower_unique; do not duplicate that index.
create or replace function public.change_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
begin
  if not private.is_verified() then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  normalized := lower(btrim(coalesce(p_username, '')));
  if normalized !~ '^[a-z0-9_]{3,30}$' then
    raise exception using errcode = '22023', message = 'INVALID_USERNAME';
  end if;

  if not exists (
    select 1
    from auth.mfa_factors
    where user_id = auth.uid()
      and factor_type = 'totp'
      and status = 'verified'
  ) then
    raise exception using errcode = 'P0001', message = 'MFA_REQUIRED';
  end if;

  if coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception using errcode = 'P0001', message = 'MFA_CHALLENGE_REQUIRED';
  end if;

  begin
    update public.profiles
      set username = normalized
      where id = auth.uid();
  exception
    when unique_violation then
      raise exception using errcode = '23505', message = 'USERNAME_TAKEN';
  end;

  if not found then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  return normalized;
end $$;

revoke all on function public.change_username(text) from public, anon;
grant execute on function public.change_username(text) to authenticated;
