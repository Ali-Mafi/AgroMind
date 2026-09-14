-- Users who opt into MFA must present an AAL2 session before application data
-- can be read or changed. Users without a verified MFA factor continue to use
-- AAL1 or AAL2 normally. This mirrors Supabase's recommended opt-in MFA gate.
create or replace function private.mfa_access_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      not exists (
        select 1
        from auth.mfa_factors factor
        where factor.user_id = (select auth.uid())
          and factor.status = 'verified'
      )
      or coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2'
    );
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
