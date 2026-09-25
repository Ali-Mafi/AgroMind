create or replace function public.complete_onboarding()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_verified() then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not private.mfa_access_allowed() then
    raise exception using errcode = '42501', message = 'MFA_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.farms
    where account_id = private.current_account_id()
  ) then
    raise exception 'FIRST_FARM_REQUIRED';
  end if;

  update public.profiles
    set onboarding_completed = true,
        onboarding_step = 5
    where id = auth.uid()
      and country_code is not null
      and btrim(first_name) <> ''
      and btrim(last_name) <> '';

  if not found then
    raise exception 'PROFILE_INCOMPLETE';
  end if;
end $$;
