-- Users who opt into MFA must present an AAL2 session before application data
-- can be read or changed. Users without a verified MFA factor continue to use
-- AAL1 or AAL2 normally. This mirrors Supabase's recommended opt-in MFA gate.
-- The runtime lookup keeps isolated migration tests portable when the managed
-- auth.mfa_factors/auth.jwt objects are not present outside hosted Supabase.
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

create policy "mfa_gate"
on public.profiles
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

create policy "mfa_gate"
on public.accounts
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

create policy "mfa_gate"
on public.subscriptions
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

create policy "mfa_gate"
on public.farms
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

create policy "mfa_gate"
on public.irrigation_schedules
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

create policy "mfa_gate"
on public.legacy_imports
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));
