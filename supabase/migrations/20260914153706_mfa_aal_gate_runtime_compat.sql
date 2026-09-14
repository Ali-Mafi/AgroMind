create or replace function private.mfa_access_allowed()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  subject uuid := auth.uid();
  factor_enabled boolean := false;
  level text := 'aal1';
begin
  if subject is null then return false; end if;
  if to_regclass('auth.mfa_factors') is null then return true; end if;

  execute 'select exists (select 1 from auth.mfa_factors where user_id = $1 and status = ''verified'')'
    into factor_enabled
    using subject;

  if not factor_enabled then return true; end if;

  execute 'select coalesce(auth.jwt()->>''aal'', ''aal1'')'
    into level;
  return level = 'aal2';
end;
$$;

revoke all on function private.mfa_access_allowed() from public, anon;
grant execute on function private.mfa_access_allowed() to authenticated;
